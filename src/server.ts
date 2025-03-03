import Logger from './core/Logger';
import { port } from './config';
import { server } from './helpers/socket';

server
  .listen(port, () => {
    Logger.info(`server running on port : ${port}`);
  })
  .on('error', (e) => Logger.error(e));
