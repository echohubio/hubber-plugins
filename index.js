import path from 'path';
import fs from 'fs';
import Debug from 'debug';

const debug = Debug('hubber:plugin:plugins');

const storePluginState = (iot, architect) => {
  debug('syncing plugin state');

  const plugins = [];

  architect.config.forEach((pluginData) => {
    const pluginPath = pluginData.packagePath;
    if (!pluginPath) {
      return;
    }

    const packagePath = path.join(pluginPath, 'package.json');
    const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const plugin = {
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      author: metadata.author,
      license: metadata.license,
      homepage: metadata.homepage,
      bugs: metadata.bugs,
    };
    plugins.push(plugin);
  });

  iot.saveState('plugins', plugins);
};

const execute = (payload) => {
  debug('execute');
  debug(payload);

  const command = payload.command;

  switch (command) {
    default:
      console.error('Unknown command');
  }
};

const setup = (options, imports, register) => {
  Debug('setup');

  Debug('options:', options);
  Debug('imports:', imports);

  const iot = imports.iot;
  const hub = imports.hub;

  register(null, {
    plugins: {
      execute,
    },
  });

  hub.on('ready', (architect) => {
    storePluginState(iot, architect);
  });
};

export default setup;
