import express, { Response, Request } from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import cors from 'cors';
import puppeteer, { Browser } from 'puppeteer';
import { renderUrl, renderHtml } from './render';
import { applyContentDisposition, getPdfOptions, getParam, validations } from './utils';
import { RequestError } from './exceptions';

const app = express();

app.use(cors());

const inflate = true;
const limit = 1e7;
app.use(bodyParser.text({ type: ['text/html', 'text/plain'], inflate, limit }));
app.use(bodyParser.raw({ inflate, limit }));
app.use(bodyParser.json({ inflate, limit }));
app.use(bodyParser.urlencoded({ extended: false, inflate, limit }));
var storage = multer.memoryStorage();
app.use(multer({ storage: storage, limits: { fieldSize: limit } }).any());

let browser: Browser;

const port = Number(process.env.PORT) || 5000;
const host = process.env.IP || '0.0.0.0';

app.get('/:filename', function(req, res) {
  applyContentDisposition(req, res);
  const pdfOptions = getPdfOptions(req);
  const url = getParam(req, 'url', true, undefined, [validations.required]);
  console.log('GET', req.params.filename, url, pdfOptions);

  renderUrl(browser, url, pdfOptions)
    .then(buffer => res.send(buffer))
    .catch(error => reportError(error, req, res));
});

app.post('/:filename', function(req, res) {
  req.accepts('html', 'text', 'json');
  applyContentDisposition(req, res);
  const pdfOptions = getPdfOptions(req);
  let html;
  console.log('POST', req.params.filename, pdfOptions);

  const contentType = req.header('content-type') || '';

  if (/text\/(html|plain)/.test(contentType)) {
    html = req.body;
  } else if (/(application\/(json|x-www-form-urlencoded)|multipart\/form-data)/.test(contentType)) {
    html = req.body.html;
  } else {
    console.log(req.header('content-type'));
    console.log(req.body);
  }

  if (html === undefined) {
    html = `
      <h1>Error rendering pdf</h1>
      <p>Missing 'html' body to render</p>
    `;
    res.status(400);
  }

  renderHtml(browser, html, pdfOptions)
    .then(buffer => res.send(buffer))
    .catch(error => reportError(error, req, res));
});

app.listen(port, host, async function() {
  console.log('server started at:', host, port);

  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
});

// Handle 404 - Keep this as a last route
app.use(function(_req, res) {
  res.status(404).send('404: Not Found');
});

function reportError(err: any, req: Request, res: Response, _next?: any) {
  if (err instanceof RequestError) {
    // console.error(err);
    err.report(req, res);
  } else {
    console.error(err.stack);
    res
      .status(500)
      .contentType('text')
      .send('Something broke!');
  }
}

app.use(reportError);
