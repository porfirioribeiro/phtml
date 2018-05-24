import { Request, Response } from 'express';
import { BadRequestError } from './exceptions';
import { PDFOptions } from 'puppeteer';

type Validator = (name: string, value: any) => string | undefined | false;
type Formatter = (v: any) => any;

export function getParam(
  req: Request,
  name: string,
  query = false,
  defaultValue: any = undefined,
  validations?: Validator[],
  format?: Formatter,
) {
  const value = query ? req.query[name] : req.params[name];

  if (validations) {
    const failed = validations.reduce((acc: any, v) => acc || v(value, name), false);
    if (failed) {
      throw new BadRequestError({
        [name]: failed,
      });
    }
  }
  return format && value !== undefined ? format(value) : value || defaultValue;
}

export function getParams(
  req: Request,
  o: {
    [name: string]: {
      query?: boolean;
      defaultValue?: any;
      validations?: Validator[];
      formatter?: Formatter;
    };
  },
) {
  return Object.keys(o).reduce((acc, name) => {
    const v = getParam(
      req,
      name,
      o[name].query,
      o[name].defaultValue,
      o[name].validations,
      o[name].formatter,
    );
    return v === undefined
      ? acc
      : {
          ...acc,
          [name]: v,
        };
  }, {});
}

export const validations = {
  required(value: any, _name: string) {
    return !value ? `Required value` : false;
  },
  oneOf(list: any[]) {
    return function(value: any, _name: string) {
      return value && !list.includes(value) ? `Must be one of ${list.join(' | ')}` : false;
    };
  },
};

export function applyContentDisposition(req: Request, res: Response) {
  const disposition = getParam(req, 'disposition', true, 'inline', [
    validations.oneOf(['inline', 'attachment']),
  ]);

  res.header('Content-type', 'application/pdf');
  res.header('Content-disposition', disposition + '; filename=' + req.params.filename);
}
export function getPdfOptions(req: Request): Partial<PDFOptions> {
  const params: Partial<PDFOptions> = getParams(req, {
    scale: { query: true, formatter: Number },
    displayHeaderFooter: { query: true, formatter: Boolean },
    headerTemplate: { query: true },
    footerTemplate: { query: true },
    printBackground: { query: true, formatter: Boolean },
    landscape: { query: true, formatter: Boolean },
    pageRanges: { query: true },
    format: {
      query: true,
      validations: [
        validations.oneOf([
          'Letter',
          'Legal',
          'Tabload',
          'Ledger',
          'A0',
          'A1',
          'A2',
          'A3',
          'A4',
          'A5',
        ]),
      ],
    },
    width: { query: true },
    height: { query: true },
    margin: { query: true },
  });


  return params;
}
