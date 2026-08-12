"""Tiny static file server for local preview of the landing page."""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer  # noqa: E402

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        SimpleHTTPRequestHandler.end_headers(self)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    print("serving %s on http://localhost:%d" % (ROOT, PORT), flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
