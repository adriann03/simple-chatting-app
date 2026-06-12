import { LocalGroup } from '../types';

const BASE_URL = 'http://34.101.88.99:3000/api'; // Mocked VM IP

export const syncGroupToCloud = async (groupId: string, groupName: string, key: string): Promise<LocalGroup | null> => {
  console.log(`[API] POST ${BASE_URL}/groups/create`, { groupId, groupName, key });
  
  // Simulating network delay and response
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        group_id: groupId,
        group_name: groupName,
        frequency_key: key
      });
    }, 1000);
  });
};
