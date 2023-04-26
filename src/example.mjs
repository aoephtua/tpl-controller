// Copyright (c) 2023, Thorsten A. Weintz. All rights reserved.
// Licensed under the MIT license. See LICENSE in the project root for license information.

import TplController from './tpl-controller.mjs';

/**
 * String with network identifier.
 */
const network = '192.168.178';

/**
 * Array with hosts and passwords of TPL devices.
 */
const devices = [
    { host: 1, pwd: '****' },
    { host: 2, pwd: '****' },
    { host: 3, pwd: '****' },
    { host: 4, pwd: '****' }
];

/**
 * Iterates over multiple devices.
 */
for (const device of devices) {
    const { host, pwd } = device;

    /**
     * IP address with network identifier and host.
     */
    const ipAddress = `${network}.${host}`;
    
    /**
     * Initializes instance of @see TplController.
     */
    const tplController = new TplController({
        ipAddress, password: pwd
    });

    /**
     * Turns device led on, off or toggle.
     */
    const { state } = await tplController.turnLed('toggle');

    /**
     * Outputs IP address of device and action state.
     */
    console.log(ipAddress, state);
}
