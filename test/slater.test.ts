import { NextApiRequest, NextApiResponse } from 'next';
import { slater, QueueConfig, TaskConfig, getStatusFromConfig } from '../';

const config: QueueConfig = {
  queues: [
    {
      name: 'usage Emails',
      schedule: '0 7 * * *', // 7AM
      handler: async (_event, _success, _failure) => {},
    },
  ],
};

const taskConfig: TaskConfig = {
  tasks: [
    {
      name: 'usage Emails',
      schedule: '0 7 * * *', // 7AM
      handler: async (_event, _success, _failure) => {},
    },
  ],
};

describe('queue config', () => {
  it('gets correct output', () => {
    const status = getStatusFromConfig(config.queues);
    expect(status.length).toEqual(1);
  });
  it('removes spaces and capitalization from names', () => {
    const status = getStatusFromConfig(config.queues);
    if (status.length) {
      expect(status[0].name).toEqual('usage-emails');
    }
  });
});

describe('task config', () => {
  it('gets correct output', () => {
    const status = getStatusFromConfig(taskConfig.tasks);
    expect(status.length).toEqual(1);
  });
  it('removes spaces and capitalization from names', () => {
    const status = getStatusFromConfig(taskConfig.tasks);
    if (status.length) {
      expect(status[0].name).toEqual('usage-emails');
    }
  });
});

test('task E2E', async () => {
  const mockInnerFn = jest.fn();
  const successConfig: TaskConfig = {
    tasks: [
      {
        name: 'usage Emails',
        schedule: '0 7 * * *', // 7AM
        handler: async (_event, _success, _failure) => {
          mockInnerFn();
        },
      },
    ],
  };
  const slaterFn = slater(successConfig);
  const mockReq = {
    query: {
      slater: ['usage-emails'],
    },
  };

  const mockSend = jest.fn();
  const mockJSON = jest.fn();
  const mockStatus = jest.fn();

  const mockRes = {
    send: mockSend,
    json: mockJSON,
    status: mockStatus,
  };
  await slaterFn(
    (mockReq as unknown) as NextApiRequest,
    (mockRes as unknown) as NextApiResponse
  );
  expect(mockInnerFn).toBeCalledTimes(1);
  expect(mockStatus).toBeCalledWith(200);
});

test('task E2E 404', async () => {
  const mockInnerFn = jest.fn();
  const failureConfig: TaskConfig = {
    tasks: [
      {
        name: 'usage Emails',
        schedule: '0 7 * * *', // 7AM
        handler: async (_event, _success, _failure) => {
          mockInnerFn();
        },
      },
    ],
  };
  const slaterFn = slater(failureConfig);
  const mockReq = {
    query: {
      slater: ['usageEmails'],
    },
  };

  const mockSend = jest.fn();
  const mockJSON = jest.fn();
  const mockStatus = jest.fn();

  const mockRes = {
    send: mockSend,
    json: mockJSON,
    status: mockStatus,
  };
  await slaterFn(
    (mockReq as unknown) as NextApiRequest,
    (mockRes as unknown) as NextApiResponse
  );
  expect(mockInnerFn).toBeCalledTimes(0);
  expect(mockSend).toBeCalled();
  expect(mockStatus).toBeCalledWith(404);
});
