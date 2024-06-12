const { nodeListToArray } = require('../utils')

module.exports = (files) => {
  for (const file of files.filter(f => f.path.includes('ppt/slides/slide'))) {
    const doc = file.doc
    const tableEls = nodeListToArray(doc.getElementsByTagName('a:tbl'))

    for (const tableEl of tableEls) {
      processTableEl(tableEl, doc)
    }
  }
}

function processTableEl (tableEl, doc) {
  // if needed, normalize col widths, this should be done typically only for tables
  // in vertical mode, or in dynamic rows/cell mode.
  // we calculate the col width based on the total columns in table, each col will get
  // the same width. we do this to improve the end result of table, so it fits better
  // in the slide
  if (tableEl.hasAttribute('needsColWidthNormalization')) {
    const baseColsWidth = parseInt(tableEl.getAttribute('needsColWidthNormalization'), 10)

    tableEl.removeAttribute('needsColWidthNormalization')

    const gridColEls = nodeListToArray(tableEl.getElementsByTagName('a:gridCol'))
    // ensure we don't end with float number, the w property does not admit it
    const colWidth = Math.trunc(baseColsWidth / gridColEls.length)

    for (const gridColEl of gridColEls) {
      gridColEl.setAttribute('w', colWidth)
    }
  }

  const cellEls = nodeListToArray(tableEl.getElementsByTagName('a:tc'))

  // normalize table cells to contain at least paragraph
  // this is needed because user can put conditions across cells
  // which may produce cells with no content elements
  for (let cellIdx = 0; cellIdx < cellEls.length; cellIdx++) {
    const cellEl = cellEls[cellIdx]

    // remove gridSpan attribute if it contains normal value (0, 1)
    // because it is unneeded to specify those
    if (cellEl.hasAttribute('gridSpan')) {
      const gridSpan = parseInt(cellEl.getAttribute('gridSpan'), 10)

      if (gridSpan < 2) {
        cellEl.removeAttribute('gridSpan')
      }
    }

    // remove rowSpan attribute if it contains normal value (0, 1)
    // because it is unneeded to specify those
    if (cellEl.hasAttribute('rowSpan')) {
      const rowSpan = parseInt(cellEl.getAttribute('rowSpan'), 10)

      if (rowSpan < 2) {
        cellEl.removeAttribute('rowSpan')
      }
    }

    if (cellEl.hasAttribute('hMerge') && cellEl.getAttribute('hMerge') !== '1') {
      cellEl.removeAttribute('hMerge')
    }

    if (cellEl.hasAttribute('vMerge') && cellEl.getAttribute('vMerge') !== '1') {
      cellEl.removeAttribute('vMerge')
    }

    const cellChildEls = nodeListToArray(cellEl.childNodes)
    let existingTBodyEl
    const restOfChildren = []

    for (let idx = 0; idx < cellChildEls.length; idx++) {
      const childEl = cellChildEls[idx]

      if (childEl.nodeName === 'a:txBody') {
        existingTBodyEl = childEl
      } else if (childEl.nodeName !== 'a:tcPr') {
        // store if there are meaningful elements
        restOfChildren.push(childEl)
      }
    }

    if (
      existingTBodyEl == null &&
      restOfChildren.length === 0
    ) {
      const tbodyEl = doc.createElement('a:txBody')
      const aBodyPrEl = doc.createElement('a:bodyPr')
      const aLstStyleEl = doc.createElement('a:lstStyle')
      const aPEl = doc.createElement('a:p')

      tbodyEl.appendChild(aBodyPrEl)
      tbodyEl.appendChild(aLstStyleEl)
      tbodyEl.appendChild(aPEl)

      cellEl.appendChild(tbodyEl)
    }
  }
}
