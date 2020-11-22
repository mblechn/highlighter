import React, { useCallback, useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import './App.css';
import samplePDF from './test.pdf';
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

function getTextItemWithNeighbors(textItems, itemIndex, span = 1) {
  return textItems
    .slice(Math.max(0, itemIndex - span), itemIndex + 1 + span)
    .filter(Boolean)
    .map(item => item.str)
    .join('');
}

function getIndexRange(string, substring) {
  const indexStart = string.toLowerCase().indexOf(substring.toLowerCase());
  const indexEnd = indexStart + substring.length;

  return [indexStart, indexEnd];
}

export default function App() {
  const [searchText, setSearchText] = useState('');
  const [textItems, setTextItems] = useState();

  const onPageLoadSuccess = useCallback(async page => {
    const textContent = await page.getTextContent();
    setTextItems(textContent.items);
  }, []);

  const customTextRenderer = useCallback(textItem => {
    //  for each search string ... {
    //    if entire string found in current textItem {
    //      save string to currentTextItemHighlights array
    //    } else {
    //      if entire string found across mulitple textItems {
    //        if at least part of string is in current textItem {
    //          save that part of string to currentTextItemHighlights array
    //        }
    //      }
    //    }
    //  }
    //  send currentTextItemHighlights and current textItem to highlightPattern function

    if (!textItems || !searchText) return;

    const { itemIndex } = textItem; 
    const patternsAsArray = searchText.split('|');
    let currentTextItemHighlights = [];
    //for each separate string to be found
    patternsAsArray.forEach((item, index) => {
      const regexPattern = new RegExp(patternsAsArray[index], 'gi')
      if(textItem.str.match(regexPattern)) {
        //entire string found in current textItem
        currentTextItemHighlights.push(patternsAsArray[index])
      } else {
        const textItemWithNeighbors = getTextItemWithNeighbors(
          textItems,
          itemIndex,
        );
        if(textItemWithNeighbors.match(regexPattern)) {
          //string found across mulitple textItems
          const [matchIndexStart, matchIndexEnd] = getIndexRange(
            textItemWithNeighbors,
            patternsAsArray[index]
          );
          const [textItemIndexStart, textItemIndexEnd] = getIndexRange(
            textItemWithNeighbors,
            textItem.str,
          );
          if (
            // Match not entirely in the previous line
            !(matchIndexEnd < textItemIndexStart) &&
            // Match not entirely in the next line
            !(matchIndexStart > textItemIndexEnd)
          ) {
            //at least part of string is in current textItem
            const indexOfCurrentTextItemInMergedLines = textItemWithNeighbors.toLowerCase().indexOf(
              textItem.str.toLowerCase(),
            );
            const matchIndexStartInTextItem = Math.max(
              0,
              matchIndexStart - indexOfCurrentTextItemInMergedLines,
            );
            const matchIndexEndInTextItem =
              matchIndexEnd - indexOfCurrentTextItemInMergedLines;
      
            const partialStringToHighlight = textItem.str.slice(
              matchIndexStartInTextItem,
              matchIndexEndInTextItem,
            );
            currentTextItemHighlights.push(partialStringToHighlight)
          }
        }
      };
    });
    return highlightPattern(textItem.str, currentTextItemHighlights.join('|'));
  },[searchText, textItems]);

  function onChange(event) {
    setSearchText(event.target.value);
  }

  return (
    <>
      <Document file={samplePDF}>
        <Page
          customTextRenderer={customTextRenderer}
          onLoadSuccess={onPageLoadSuccess}
          pageNumber={1}
        />
      </Document>
      <div>
        <label htmlFor="search">Search:</label>
        <input type="search" size="100" id="search" value={searchText} onChange={onChange} />
      </div>
    </>
  );
}
