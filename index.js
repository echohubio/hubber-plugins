import Debug from 'debug';

const debug = Debug('hubber:plugin:plugins');

const storePluginState = (iot) => {
  const plugins = {};
  const state = {
    plugins,
  };

  iot.saveState('plugins', state);
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

  hub.on('ready', () => {
    storePluginState(iot);
  });
};

export default setup;
