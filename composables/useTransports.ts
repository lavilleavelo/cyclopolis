import config from '~/config.json';

export const useTransports = () => {
  function getTransport(type: string, line: string) {
    return config.transports.find(transport => transport.type === type && transport.line === line);
  }

  return { getTransport };
};
