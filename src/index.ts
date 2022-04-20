import type { NextApiRequest, NextApiResponse } from 'next'
const MurmurHash3 = require('imurmurhash');

export const sum = (a: number, b: number) => {
  if ('development' === process.env.NODE_ENV) {
    console.log('boop');
  }
  return a + b;
};

type Config = {
  queues: [
    {
      name: string;
      schedule: string;
      handler: (event: any, success: any, failure: any) => Promise<any>;
    }
  ];
};
// @ts-ignore 
export const slater = (config: Config) => (req: NextApiRequest, res: NextApiResponse):any  => {
  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const successHandler = (props: any) => {
      console.log('success');
      return props;
    };
    const errorHandler = (props: unknown) => {
      console.log('error');
      return props;
    };
    const { slater } = req.query;
  
    const queueName = slater[0];
  
    if (queueName === 'status') {
      const results = config.queues.map(queue => {
        return {
          name: queue.name,
          schedule: queue.schedule,
          handlerVersion: MurmurHash3(queue.handler.toString()).result(),
        };
      });
      return res.end(JSON.stringify(results));
    }
    const queue = config.queues.find(q => q.name === queueName);
  
    if (!queue) {
      return res.status(404).send(`Queue ${queueName} not found`);
    }
  
    // if (queue.secret !== req.query.secret) {
    //   return res.status(401).send(`Queue ${queueName} secret incorrect`);
    // }
  
    if (!queue.handler) {
      return res.status(500).send(`Queue ${queueName} has no handler`);
    }
  
    try {
      const results = await queue.handler(slater, successHandler, errorHandler);
  
      return res.status(200).send(results);
    } catch (err) {
      errorHandler(err);
      return res.status(500).send(err);
    }
  }
  return handler;
};