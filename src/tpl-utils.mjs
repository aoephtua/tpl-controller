const encrypt=(r,t,c)=>{for(var o=c=c||'yLwVl0zKqws7LgKPRQ84Mdt708T1qQ3Ha7xv3H7NyU84p21BriUWBU43odz3iP4rBL3cD02KZciXTysVXiV8ngg6vL48rPJyAUw0HurW20xqxv9aYb4M9wK1Ae0wlro510qXeU07kV57fQMc8L6aLgMLwygtc0F10a0Dg70TOoouyFhdysuRMO51yY5ZlOZZLEal1h0t9YQW0Ko7oBwmCAHoic4HYbUyVeU3sfQ1xtXcPcf1aT303wAQhv66qzW',a='',e=187,h=187,y=r.length,g=(t=t||'RDpbLfCPsJZ7fiv').length,A=o.length,L=g<y?y:g,w=0;w<L;w++)h=e=187,y<=w?h=t.charCodeAt(w):g<=w?e=r.charCodeAt(w):(e=r.charCodeAt(w),h=t.charCodeAt(w)),a+=o.charAt((e^h)%A);return a};

export {
    encrypt
};
