# cors_server.py
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

if __name__ == '__main__':
    server_address = ('0.0.0.0', 5000)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print("Serving with CORS at http://0.0.0.0:5000")
    httpd.serve_forever()

