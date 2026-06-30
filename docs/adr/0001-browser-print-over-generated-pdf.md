# Browser print instead of server-generated PDF

The invoice document is a single screen that is also the print layout: interactive
controls are hidden with a `.no-print` class and `@media print` CSS, and the mechanic
exports via the browser's "Print → Save as PDF". We chose this over a PDF library
(`@react-pdf`) or a server render route because it is far less code, keeps a single
source of truth for the layout (no duplicate "edit" vs "print" views), and is more
than good enough for a concept demo. Trade-off: exact output depends on the browser's
print dialog rather than a pixel-controlled PDF.
