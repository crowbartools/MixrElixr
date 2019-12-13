const clone = subject => JSON.parse(JSON.stringify(subject));

export default function merge(target, subject) {
    Object.keys(subject).forEach(key => {
        if (subject[key] === undefined) {
            return;
        }

        let value = subject[key],
            isObjectLiteral = Object.prototype.toString.call(value) === '[object Object]';

        // Value can replace target[key] with out deep merging
        if (
            value === null ||
            value === true ||
            value === false ||
            (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)) ||
            typeof value === 'string' ||
            Array.isArray(value) ||
            (isObjectLiteral && !Object.prototype.hasOwnProperty.call(target, key))
        ) {
            target[key] = clone(value);

        // Value is an object literal
        } else if (isObjectLiteral) {
            merge(target[key], clone(value));
        }
    });

    return target;
}