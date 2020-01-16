/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/
import { Server } from 'hapi';
import { plugin } from './app/plugins';

const init = async () => {
  const server = new Server({
    port: 3333,
    host: 'localhost',
    routes: {
      cors: { //adding cors policy to access the API
        origin: ["*"],
        headers: ["Accept", "Content-Type"]
      }
    }
  });

  // Registering the plugin of stock api as a config and adding the prefix '/stock'
  await server.register({
    plugin: plugin,
    routes: {
      prefix: '/stock'
    },
    options: {
      message: 'stock api started'
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

init();
