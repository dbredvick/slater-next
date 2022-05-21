import type { NextApiRequest, NextApiResponse } from 'next'
const MurmurHash3 = require('imurmurhash');
import slug from 'slug';

export type TaskConfig = {
  tasks: [
    {
      name: string;
      schedule: string;
      handler: (event: any, success: any, failure: any) => Promise<any>;
    }
  ];
}

export type QueueConfig = {
  queues: [
    {
      name: string;
      schedule: string;
      handler: (event: any, success: any, failure: any) => Promise<any>;
    }
  ];
}

type Config = TaskConfig | QueueConfig;
  
const isQueueConfig = (config: any) => {
   if(config?.queues?.length){
     return config as QueueConfig;
   }
   return false;
}

const isTaskConfig = (config: any) => {
  if(config?.tasks?.length){
    return config as TaskConfig;
  }
  return false;
}

export const getStatusFromConfig = (items: [{name: string;
  schedule: string;
  handler: (event: any, success: any, failure: any) => Promise<any>;}] )  => {
  const results = items.map(queue => {
    return {
      name: slug(queue.name),
      schedule: queue.schedule,
      handlerVersion: MurmurHash3(queue.handler.toString()).result(),
    };
  });
  return results as {name: string;
    schedule: string;
    handlerVersion: string}[];
}

// @ts-ignore 
export const slater = (config: Config) => async (req: NextApiRequest, res: NextApiResponse):any  => {
    const successHandler = (props: any) => {
      console.log('success');
      return props;
    };
    const errorHandler = (props: unknown) => {
      console.log('error', props);
      return props;
    };
    const { slater } = req.query;
    
    let items

    if(isQueueConfig(config)){
      const queueConfig = config as QueueConfig;
      items = queueConfig.queues;
    }

    if(isTaskConfig(config)){
      const taskConfig = config as TaskConfig;
      items = taskConfig.tasks;
    }

    if(!items || !items.length){
      if ('development' === process.env.NODE_ENV) {
        console.log('Missing key "tasks" or "queues". Please define one to use Slater. If you publish this code to production, it will remove all currently configured tasks/queues for this project.');
      }
      if ('production' === process.env.NODE_ENV) {
        console.log('Missing key "tasks" or "queues". Deploying to production will remove currently configured queues/tasks.');
      }
    }
  
    const queueName = slater[0];
  
    if (queueName === 'status') {
      const results = items ? getStatusFromConfig(items) : [];
      return res.end(JSON.stringify(results));
    }
    const queue = items?.find(q => slug(q.name) === queueName);
  
    if (!queue) {
      res.status(404);
      return res.send(`Queue ${queueName} not found`);
    }
  
    // if (queue.secret !== req.query.secret) {
    //   return res.status(401).send(`Queue ${queueName} secret incorrect`);
    // }
  
    if (!queue.handler) {
      res.status(500);
      return res.send(`Queue ${queueName} has no handler`);
    }
  
    try {
      const results = await queue.handler(slater, successHandler, errorHandler);
  
      res.status(200)
      return res.send(results);
    } catch (err) {
      errorHandler(err);
      res.status(500);
      return res.send(err);
    }
}
