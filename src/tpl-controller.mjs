// Copyright (c) 2023, Thorsten A. Weintz. All rights reserved.
// Licensed under the MIT license. See LICENSE in the project root for license information.

import axios from 'axios';
import { encrypt } from './tpl-utils.mjs';

/**
 * 
 */
class TplController {

    /**
     * Default commands of @see TplController.
     */
    commands = {
        led: {
            id: '112|1,0,0',
            keys: {
                enable: {
                    aliases: { on: 1, off: 0 },
                    toggle: true
                }
            }
        }
    };

    /**
     * Default data separator of @see TplController.
     */
    separator = '\r\n';

    /**
     * Initializes new instance of @see TplController.
     * 
     * @param {object} settings Object with global settings.
     */
    constructor(settings) {
        this.settings = settings;
    }

    /**
     * Turns states of TPL device.
     * 
     * @param {object} command Object with command configuration.
     * @param {object} values Object with upcoming values.
     * @returns Object with result of processed action.
     */
    async turnStates(command, values) {
        if (command) {
            const states = this.#validateStates(command, values);

            if (states) {
                const { ipAddress, password } = this.settings;
    
                if (ipAddress && password) {
                    return await this.#process(
                        ipAddress,
                        password,
                        command,
                        states
                    );
                }
            } else {
                return this.#state('invalid state');
            }
        } else {
            return this.#state('invalid command');
        }
    }

    /**
     * Turns LED state of TPL device.
     * 
     * @param {*} state Upcoming alias or state to control LED of TPL device.
     * @returns Object with result of processed action.
     */
    turnLed = async (state) => await this.turnStates(this.commands.led, { enable: state });

    /**
     * Processes requested command of TPL device.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {string} password The plain passphrase of TPL device.
     * @param {object} command Object with command configuration.
     * @param {object} states Object with upcoming states.
     * @returns Object with result of processed action.
     */
    async #process(ipAddress, password, command, states) {
        const result = {};

        const authInfo = await this.#fetchAuthInfo(ipAddress);

        if (authInfo) {
            if (authInfo.error) return this.#state(authInfo.error);

            const id = this.#getId(authInfo, password);

            const { status, error } = await this.#login(ipAddress, id);

            if (status === 200) {
                const values = await this.#fetchState(ipAddress, id, command.id);

                if (values?.length) {
                    result.state = await this.#processState(ipAddress, command, states, values, id);

                    await this.#logout(ipAddress, id);
                }
            } else if (error) {
                return this.#state(error);
            }
        }

        return result;
    }

    /**
     * Processes upcoming command states of TPL device.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {object} command Object with command configuration.
     * @param {object} states Object with upcoming states.
     * @param {object} values Object with upcoming values.
     * @param {string} id The encrypted identifier of authentication.
     * @returns Object with result of processed action.
     */
    async #processState(ipAddress, command, states, values, id) {
        const data = this.#mergeStates(command, states, values);

        if (data) {
            const result = await this.#setState(ipAddress, id, data);

            return result.data.startsWith('00000') ? 'success' : 'error';
        } else {
            return 'no action';
        }
    }
    
    /**
     * Gets encrypted authentication identifier by password of TPL device. 
     * 
     * @param {Array} authInfo Array with authentication values.
     * @param {string} password The plain device password.
     * @returns String with encrypted identifier.
     */
    #getId = (authInfo, password) =>
        encrypt(authInfo[3], encrypt(password), authInfo[4]);

    /**
     * Fetches authentication values of TPL device.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @returns Array with authentication values.
     */
    #fetchAuthInfo = async (ipAddress) => await this.#fetchValues(ipAddress, {
        params: { code: 7, asyn: 1 },
        validateStatus: status => status === 401
    });

    /**
     * Executes POST request method to grant login.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {string} id The encrypted identifier of authentication.
     * @returns Object with response data of HTTP request.
     */
    #login = async (ipAddress, id) => await this.#postCode(ipAddress, 7, 0, id);

    /**
     * Executes POST request method to logout.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {string} id The encrypted identifier of authentication.
     * @returns Object with response data of HTTP request.
     */
    #logout = async (ipAddress, id) => await this.#postCode(ipAddress, 11, 0, id);

    /**
     * Executes POST request method and fetches states by identifier and data.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {string} id The encrypted identifier of authentication.
     * @param {string} data The data to be sent as the request body.
     * @returns Object with response data of HTTP request.
     */
    #fetchState = async (ipAddress, id, data) => await this.#fetchValues(ipAddress, {
        params: { code: 2, asyn: 0, id }, data
    });

    /**
     * Executes POST request method and sets states by identifier and data.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {string} id The encrypted identifier of authentication.
     * @param {string} data The data to be sent as the request body.
     * @returns Object with response data of HTTP request.
     */
    #setState = async (ipAddress, id, data) => await this.#post(ipAddress, {
        params: { code: 1, asyn: 0, id }, data
    });

    /**
     * Executes POST request method and fetches values.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {object} config Object with request configuration values.
     * @returns Array with response data values.
     */
    async #fetchValues(ipAddress, config) {
        const response = await this.#post(ipAddress, config);

        if (response.error) return response;

        return response.data?.split(this.separator).filter(value => value);
    }

    /**
     * Executes POST request method by URL parameters.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {number} code The code value for URL parameter.
     * @param {number} asyn The asyn value for URL paramter.
     * @param {string} id The encrypted identifier of authentication.
     * @returns Object with response data of HTTP request.
     */
    #postCode = async (ipAddress, code, asyn, id) => await this.#post(
        ipAddress, { params: { code, asyn, id } }
    );

    /**
     * Executes POST request method.
     * 
     * @param {string} ipAddress The target IP address of TPL device.
     * @param {object} config Object with request configuration values. 
     * @returns Object with response data of HTTP request.
     */
    async #post(ipAddress, config) {
        const url = `http://${ipAddress}`;

        try {
            return await axios({
                method: 'post',
                headers: {
                    'Host': ipAddress,
                    'Referer': url
                },
                url,
                ...config
            });
        } catch ({ message }) {
            return { error: message };
        }
    }

    /**
     * Gets current states of command key.
     * 
     * @param {Array} values Array with current values.
     * @returns Array with keys and values of current states.
     */
    #getCurrentStates = (values) => Object.fromEntries(
        values
            .slice(2)
            .map(value => value.split(' '))
    );

    /**
     * Extracts values of command key aliases.
     * 
     * @param {object} aliases Object with aliases of command key.
     * @returns Array with values of aliases.
     */
    #getValues = (aliases) => Object.values(aliases).map(value => value + '');

    /**
     * Gets upcoming value by command configuration.
     * 
     * @param {object} command Object with command configuration.
     * @param {string} key The key of the state.
     * @param {string} state The upcoming state.
     * @param {string} value The value of the state.
     * @returns String with upcoming value.
     */
    #getUpcomingValue(command, key, state, value) {
        if (state === -1 + '') {
            const aliases = command.keys[key]?.aliases;

            if (aliases) {
                const values = this.#getValues(aliases);

                if (values.length === 2) {
                    const idx = values.indexOf(value);

                    return idx === 0 ? values[1] : values[0];
                }
            }

            return value === '0' ? '1' : '0';
        }

        return state;
    }

    /**
     * Merges states and produces command output.
     * 
     * @param {object} command Object with command configuration.
     * @param {object} states Object with states.
     * @param {Array} values Array with values.
     * @returns String with command by identifier and states.
     */
    #mergeStates(command, states, values) {
        let data = '';

        const current = this.#getCurrentStates(values);

        for (const key in states) {
            const value = current[key];
            const state = states[key] + '';

            if (value !== state) {
                const upcoming = this.#getUpcomingValue(command, key, state, value);

                data += `${this.separator}${key} ${upcoming}`;
            }
        }

        return data && `id ${command.id}${data}`;
    }

    /**
     * Validates states and returns edited values.
     * 
     * @param {object} command Object with command configuration.
     * @param {Array} values Array with values.
     * @returns Object with values without aliases.
     */
    #validateStates(command, values) {
        const keys = command.keys;

        if (keys && values) {
            const result = {};

            for (const key in values) {
                if (key in keys) {
                    const { aliases, toggle } = keys[key];
                    const value = (values[key] + '').toLowerCase();

                    if (aliases && value in aliases) {
                        result[key] = aliases[value];
                    } else if (toggle && value === 'toggle') {
                        result[key] = -1;
                    }
                } else {
                    result[key] = values[key];
                }
            }

            return result;
        }
    }

    /**
     * Gets object with action state.
     * 
     * @param {string} state String with action state value.
     */
    #state = (state) => ({ state });
}

/**
 * Exports @see TplController as default class.
 */
export default TplController;
