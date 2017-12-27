import { remote } from 'electron';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import npmi from 'npmi';

class Plugins {
  constructor(options, imports, register) {
    log.debug('Plugins setup');

    // log.debug('options:', options);
    // log.debug('imports:', imports);

    this.options = options;
    this.hub = imports.hub;
    this.config = imports.config;

    register(null, {
      plugins: this,
    });

    this.hub.on('ready', (architect) => {
      this.architect = architect;
    });
  }

  async execute(payload) {
    log.debug('execute');
    log.debug(payload);

    const { command } = payload;

    let result;
    switch (command) {
      case 'list':
        result = await this.list(payload.args);
        break;
      case 'install':
        result = await this.install(payload.args);
        break;
      default:
        log.error('Unknown command');
    }

    return result;
  }

  list() {
    const plugins = [];

    this.architect.config.forEach((pluginData) => {
      const pluginPath = pluginData.packagePath;
      if (!pluginPath) {
        return;
      }

      const packagePath = path.join(pluginPath, 'package.json');
      const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const name = metadata.name.replace(/^hubber-/, '');
      const plugin = {
        name,
        version: metadata.version,
        description: metadata.description,
        author: metadata.author,
        license: metadata.license,
        homepage: metadata.homepage,
        bugs: metadata.bugs,
      };
      plugins.push(plugin);
    });

    return plugins;
  }


  install({ name, version }) {
    const packageName = `hubber-${name}`;
    const fullPackage = `${packageName}@${version}`;

    const pluginPath = path.join(remote.app.getPath('userData'), 'hubber-plugins');
    log.debug(`Installing ${fullPackage} to ${pluginPath}`);

    // TODO check isn't already installed

    const options = {
      name: packageName,
      version,
      path: pluginPath,
      // npmLoad: {
      //   loglevel: 'error',
      // },
    };

    const promise = new Promise((resolve) => {
      npmi(options, (err) => {
        if (err) {
          log.debug(`Failed to install ${fullPackage}`);
          log.debug(err);
          resolve({ status: 'error', message: 'failed to install plugin' });
        }

        log.debug(`Installed ${fullPackage}`);

        // Add to the config
        this.config.addPlugin(packageName);

        // Load it
        this.architect.loadAdditionalPlugins([packageName], (loadErr) => {
          if (loadErr) {
            log.debug(`failed to load plugin ${fullPackage}`);
            log.debug(loadErr);
            resolve({ status: 'error', message: 'failed to install plugin' });
          }

          log.debug(`loaded plugin ${fullPackage}`);

          resolve({ status: 'ok', message: 'installed plugin' });
        });
      });
    });

    return promise;
  }
}

const setup = (options, imports, register) => new Plugins(options, imports, register);

export default setup;
