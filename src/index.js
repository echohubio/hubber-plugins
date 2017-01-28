import path from 'path';
import fs from 'fs';
import Debug from 'debug';
import npmInstall from 'npm-install-package';

const debug = Debug('hubber:plugin:plugins');

class Plugins {
  constructor(options, imports, register) {
    Debug('setup');

    Debug('options:', options);
    Debug('imports:', imports);

    this.options = options;
    this.iot = imports.iot;
    this.hub = imports.hub;
    this.config = imports.config;

    register(null, {
      plugins: this,
    });

    this.hub.on('ready', (architect) => {
      this.architect = architect;
      this.syncPlugins();
    });
  }

  syncPlugins() {
    // Installed vs active in on disk config
    debug('syncing plugin state');

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

    this.iot.saveState('plugins', plugins);
  }

  execute(payload) {
    debug('execute');
    debug(payload);

    const command = payload.command;

    switch (command) {
      case 'install':
        this.install(payload);
        break;
      default:
        console.error('Unknown command');
    }
  }

  install({ name, version }) {
    const packageName = `hubber-${name}`;
    const fullPackage = `${packageName}@${version}`;

    // TODO check isn't already installed

    npmInstall(fullPackage, (npmErr) => {
      if (npmErr) {
        debug(`Failed to install ${fullPackage}`);
        debug(npmErr);
        return;
      }

      debug(`Installed ${fullPackage}`);

      // Add to the config
      const plugins = this.config.get('plugins');
      plugins.push(packageName);
      this.config.set('plugins', plugins);

      // Load it
      this.architect.loadAdditionalPlugins([packageName], (loadErr) => {
        if (loadErr) {
          debug(`failed to load plugin ${fullPackage}`);
          debug(loadErr);
          return;
        }

        debug(`loaded plugin ${fullPackage}`);
        this.syncPlugins();
      });
    });
  }
}

const setup = (options, imports, register) => new Plugins(options, imports, register);

export default setup;
