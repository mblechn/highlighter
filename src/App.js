import React, { useMemo, useState } from 'react';
import { Document, Page } from 'react-pdf';
import './App.css';
import samplePDF from './test.pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function highlightPattern(text, patternsAsBarDelimitedString) {
  var patternsAsArray = patternsAsBarDelimitedString.split('|');
  var regexPattern = new RegExp(patternsAsArray[0] + "|" + patternsAsArray[1], 'gi')

  const splitText = text.split(regexPattern);

  if (splitText.length <= 1) {
    return text;
  }

  const matches = text.match(regexPattern)

  const result = splitText.reduce((arr, element, index) => (matches[index] ? [
    ...arr,
    element,
    <mark key={index} className="mark">
      {matches[index]}
    </mark>
  ] : [...arr, element]), []);

  return result;
}

export default function App() {
  const [searchText, setSearchText] = useState('');

  // const textRenderer = useMemo((textItem) => {
  //   console.log("textItem: " + textItem);
  //   return;
  //   //return highlightPattern(textItem.str, searchText);
  // }, [searchText]);

  function textRenderer(doc) {
    return highlightPattern(doc.str, searchText);
  }

  function onChange(event) {
    setSearchText(event.target.value);
  }

  return (
    <>
      <Document
        file={samplePDF}
      >
        <Page
          pageNumber={1}
          customTextRenderer={textRenderer}
        />
      </Document>
      <div>
        <label htmlFor="search">Search:</label>
        <input type="search" size="100" id="search" value={searchText} onChange={onChange} />
      </div>
    </>
  );
}
