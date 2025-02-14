const pluginDevDeps = require('../package.json').devDependencies

module.exports = (api, {
  classComponent,
  tsLint,
  lintOn = [],
  convertJsToTs,
  allowJs
}, rootOptions, invoking) => {
  if (typeof lintOn === 'string') {
    lintOn = lintOn.split(',')
  }
  const isVue3 = rootOptions && rootOptions.vueVersion === '3'

  api.extendPackage({
    devDependencies: {
      typescript: pluginDevDeps.typescript
    }
  })

  if (classComponent) {
    if (isVue3) {
      api.extendPackage({
        dependencies: {
          'vue-class-component': '^8.0.0-0'
        }
      })
    } else {
      api.extendPackage({
        dependencies: {
          'vue-class-component': pluginDevDeps['vue-class-component'],
          'vue-property-decorator': pluginDevDeps['vue-property-decorator']
        }
      })
    }
  }

  if (tsLint) {
    api.extendPackage({
      scripts: {
        lint: 'vue-cli-service lint'
      }
    })

    if (!lintOn.includes('save')) {
      api.extendPackage({
        vue: {
          lintOnSave: false
        }
      })
    }

    if (lintOn.includes('commit')) {
      api.extendPackage({
        devDependencies: {
          'lint-staged': '^9.5.0'
        },
        gitHooks: {
          'pre-commit': 'lint-staged'
        },
        'lint-staged': {
          '*.ts': ['vue-cli-service lint', 'git add'],
          '*.vue': ['vue-cli-service lint', 'git add']
        }
      })
    }

    // lint and fix files on creation complete
    api.onCreateComplete(() => {
      return require('../lib/tslint')({}, api, true)
    })
  }

  // late invoke compat
  if (invoking) {
    if (api.hasPlugin('unit-mocha')) {
      // eslint-disable-next-line node/no-extraneous-require
      require('@vue/cli-plugin-unit-mocha/generator').applyTS(api)
    }

    if (api.hasPlugin('unit-jest')) {
      // eslint-disable-next-line node/no-extraneous-require
      require('@vue/cli-plugin-unit-jest/generator').applyTS(api)
    }

    if (api.hasPlugin('eslint')) {
      // eslint-disable-next-line node/no-extraneous-require
      require('@vue/cli-plugin-eslint/generator').applyTS(api)
    }
  }

  api.render('./template', {
    hasMocha: api.hasPlugin('unit-mocha'),
    hasJest: api.hasPlugin('unit-jest')
  })

  if (isVue3) {
    api.render('./template-vue3')

    // In Vue 3, TSX interface is defined in https://github.com/vuejs/vue-next/blob/master/packages/runtime-dom/types/jsx.d.ts
    // So no need to manually add a shim.
    api.render((files) => delete files['src/shims-tsx.d.ts'])
  }

  require('./convert')(api, { tsLint, convertJsToTs })
}
