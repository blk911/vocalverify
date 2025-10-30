import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 5,
  duration: '20s',
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3000';
  
  // Test demo user creation
  const createRes = http.post(`${base}/api/admin/create-demo-user`);
  check(createRes, { 'demo user creation': r => r.status === 200 });
  
  // Test profile API
  const profileRes = http.get(`${base}/api/user/profile?memberCode=demo`);
  check(profileRes, { 'profile API': r => r.status === 200 });
  
  // Test trust units API
  const unitsRes = http.get(`${base}/api/trust/units/list?memberCode=demo`);
  check(unitsRes, { 'trust units API': r => r.status === 200 });
  
  // Test trust bonds API
  const bondsRes = http.get(`${base}/api/trust/bonds/list?memberCode=demo`);
  check(bondsRes, { 'trust bonds API': r => r.status === 200 });
  
  sleep(1);
}

