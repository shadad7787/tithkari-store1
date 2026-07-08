import KEYS from './keys.js';

export function hasKey(keyName) {
    return KEYS[keyName] && KEYS[keyName] !== 'your_' + keyName + '_here';
}

export function getKey(keyName, defaultValue) {
    return KEYS[keyName] || defaultValue;
}

export function validateAllKeys(requiredKeys) {
    var missing = [];
    var invalid = [];
    requiredKeys.forEach(function(key) {
        if (!KEYS[key]) missing.push(key);
        else if (KEYS[key].includes('your_') || KEYS[key].includes('...')) invalid.push(key);
    });
    return { isValid: missing.length === 0 && invalid.length === 0, missing: missing, invalid: invalid };
}

export default { hasKey: hasKey, getKey: getKey, validateAllKeys: validateAllKeys };
