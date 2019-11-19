// https://eslint.org/docs/user-guide/configuring
// File taken from https://github.com/vuejs-templates/webpack/blob/1.3.1/template/.eslintrc.js, thanks.

module.exports = {
    parserOptions: {
        parser: 'babel-eslint'
    },
    env: {
        node: true,
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
        'eslint:recommended',
        'plugin:vue/essential'
    ],
    // required to lint *.vue files
    plugins: ['vue'],

    // add your custom rules here
    rules: {

        // allow async-await
        "generator-star-spacing": 'off',

        // allow debugger during development
        "no-debugger": process.env.NODE_ENV === 'production' ? 'error' : 'off',

        // allow promises to be rejected without an error message
        "prefer-promise-reject-errors": ["warn", {"allowEmptyReject": true}],
        
        // Deviations from https://eslint.org/docs/rules/#possible-errors
        "no-console": 0, // Enable the use of console

        // Deviations from < https://eslint.org/docs/rules/#best-practices >
        "eqeqeq": ["error", "smart"],     // No coersion unless comparing against null
        "guard-for-in": "error",          // require an if statement with for-in loops
        "no-else-return": "error",        // no 'if () { return } else { ... }
        "no-eval": "error",               // no eval()
        "no-floating-decimal": "error",   // no trailing decimals after numbers
        "no-lone-blocks": "error",        // see:
        "no-multi-spaces": "error",       // no repeating spaces
        "no-throw-literal": "error",      // must throw an error instance
        "no-unused-expressions": "error", // see:
        "no-with": "error",               // no with statements
        "wrap-iife": "error",             // immediately called functions must be wrapped in ()'s

        // Deviation from < https://eslint.org/docs/rules/#strict-mode >
        "strict": "off", // strict not required

        // Deviation from < https://eslint.org/docs/rules/#variables >
        "no-use-before-define": "error", // require vars to be defined before use

        // Deviation from < https://eslint.org/docs/rules/#stylistic-issues >
        "array-bracket-spacing": "error",                                     // Spaces around array []'s
        "block-spacing": "error",                                             // {}'s must have whitespace around them
        "brace-style": "error",                                               // See: https://eslint.org/docs/rules/brace-style#require-brace-style-brace-style
        "camelcase": "error",                                                 // useCamelCasePleaseKThanks
        "comma-dangle": "error",                                              // No trailing commas
        "comma-spacing": "error",                                             // Reqire space after commas
        "comma-style": "error",                                               // See: https://eslint.org/docs/rules/comma-style
        "computed-property-spacing": "error",                                 // No whitespace when using object[thing]
        "indent": ["error", 4],                                               // Four-space indentions
        "key-spacing": ["error", {"beforeColon": false, "afterColon": true}], // No space before colons, atleast one space after
        "keyword-spacing": "error",                                           // Spaces around keywords
        "linebreak-style": "error",                                           // Line breaks must be \n
        "new-cap": "error",                                                   // Constructors must start with capital letter
        "no-trailing-spaces": "error",                                        // no trailing spaces
        "semi": "error",                                                      // semi-colons required
        "semi-spacing": ["error", {before: false, after: true}],              // space after semi-colon, no space before
        "semi-style": "error",                                                // See: https://eslint.org/docs/rules/semi-style
        "space-before-blocks": "error",                                       // whitespace required before and after {}
        "space-in-parens": ["error", "never"],                                // See: https://eslint.org/docs/rules/space-in-parens
        "space-infix-ops": "error",                                           // Spaces required areound operators
        "space-unary-ops": "error",                                           // See: https://eslint.org/docs/rules/space-unary-ops
        "switch-colon-spacing": "error",                                      // Spaces after case colon

        // Deviation from < https://eslint.org/docs/rules/#ecmascript-6 >
        "arrow-spacing": "error",      // Spaces required around fat-arrow function's "=>"
        "no-confusing-arrow": "error", // Don't use arrows functions in conditions
        "no-var": "error",             // Warning; Use let/const instead of var

        // Other deviations
        "no-warning-comments": ["warn", {"terms": ["todo", "to do", "fix", "fixme", "fix me", "need"], "location": "start"}], // warn about todo comments
        "no-unused-vars": ["error"]
    }
};
