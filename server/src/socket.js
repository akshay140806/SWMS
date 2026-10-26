let io = null;
export function initSocket(serverIO) {
  io = serverIO;
  io.on('connection', () => {});
}
export function getIO() { return io; }
export function emit(event, payload) {
  if (io) io.emit(event, payload);
}
