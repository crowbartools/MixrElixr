// https://eslint.org/docs/user-guide/configuring
// File taken from https://github.com/vuejs-templates/webpack/blob/1.3.1/template/.eslintrc.js, thanks.

module.exports = {
    root: true,
    parserOptions: {
        parser: 'babel-eslint'
    },
    env: {
        browser: true,
        webextensions: true
    },
    globals: {
        $: true,
        bus: true,
        settingsStorage: true,
        friendFetcher: true,
        scriptCommunication: true
    },
    extends: [
        // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
        // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
        'plugin:vue/essential',
        // https://github.com/standard/standard/blob/master/docs/RULES-en.md
        'standard',
        // https://prettier.io/docs/en/index.html
        'plugin:prettier/recommended',
        'prettier'
    ],
    // required to lint *.vue files
    plugins: ['vue', 'prettier'],

    // add your custom rules here
    rules: {
        "prettier/prettier": "error",

        // allow async-await
        "generator-star-spacing": 'off',

        // allow debugger during development
        "no-debugger": process.env.NODE_ENV === 'production' ? 'error' : 'off',

        // allow promises to be rejected without an error message
        "allowEmptyReject": true,
        "prefer-promise-reject-errors": "warn",
        
        // require let and const
        "no-var": "error",

        // force semi colons
        "semi": ["error", "always", { "omitLastInOneLineBlock": false}]
    }
};
