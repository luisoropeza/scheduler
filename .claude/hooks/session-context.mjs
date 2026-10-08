#!/usr/bin/env node
/**
 * SessionStart: tells Claude which parts of the local stack are up, so it knows whether it can
 * hit the API / UI directly or has to start them first (see the run-stack skill).
 * Output on stdout is added to the session context.
 */
import net from 'node:net';

function probe(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.setTimeout(400);
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('timeout', () => (socket.destroy(), resolve(false)));
    socket.once('error', () => resolve(false));
  });
}

/** Dev servers bind to either IPv4 or IPv6 loopback depending on the tool. */
async function isOpen(port) {
  return (await probe(port, '127.0.0.1')) || probe(port, '::1');
}

const [db, api, web] = await Promise.all([isOpen(5432), isOpen(8080), isOpen(4200)]);
const mark = (up) => (up ? 'UP' : 'down');
process.stdout.write(
  `Local stack: PostgreSQL :5432 ${mark(db)} · backend :8080 ${mark(api)} · frontend :4200 ${mark(web)}. ` +
    `Use the run-stack skill to start what is down.\n`
);
