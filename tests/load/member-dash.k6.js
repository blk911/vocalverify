import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3000';
  const res = http.get(`${base}/member-dashboard?memberCode=demo`);
  check(res, { '200': r => r.status === 200 });
  sleep(1);
}

