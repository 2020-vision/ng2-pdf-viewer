import {
  Component, Input, Output, ElementRef, EventEmitter, OnInit
} from '@angular/core';
import 'pdfjs-dist/build/pdf.combined';
import 'pdfjs-dist/web/pdf_viewer';

export class ZoomConstants {
  static readonly Auto: Zoom = 'auto';
  static readonly PageActual: Zoom = 'page-actual';
  static readonly PageWidth: Zoom = 'page-width';
  static readonly PageHeight: Zoom = 'page-height';
  static readonly PageFit: Zoom = 'page-fit';
}

export type Zoom = number | 'auto' | 'page-actual' | 'page-width' | 'page-height' | 'page-fit';

@Component({
  selector: 'pdf-viewer',
  template: `<div class="ng2-pdf-viewer-container" [ngClass]="{'ng2-pdf-viewer--zoom': zoom < 1}"><div class="pdfViewer"></div></div>`,
  styles: [`
    .ng2-pdf-viewer--zoom {
        overflow-x: scroll;
    }`
  ]
})

export class PdfViewerComponent implements OnInit {
  private _showAll: boolean = false;
  private _src: any;
  private _page: number = 1;
  private _zoom: Zoom = 1;

  private _pdfViewer: any;
  private _pdfDocument: any;

  @Output('after-load-complete') afterLoadComplete: EventEmitter<any> = new EventEmitter<any>(true);
  @Output('page-change') pageChange: EventEmitter<number> = new EventEmitter<number>(true);
  @Output('zoom-change') zoomChange: EventEmitter<number> = new EventEmitter<number>(true);

  @Input()
  set src(_src) {
    this._src = _src;

    this.loadDocument();
  }

  @Input('page')
  set page(_page) {
    _page = parseInt(_page, 10);

    if (!this._pdfDocument) {
      return;
    }

    if (this.isValidPageNumber(_page)) {
      this._page = _page;
      this.pageChange.emit(this._page);
    } else if (isNaN(_page)) {
      this.pageChange.emit(null);
    }
  }

  @Input('zoom')
  set zoom(value: any) {
    if (value <= 0) {
      return;
    }

    this._zoom = value;

    if (!this._pdfViewer) {
      return;
    }

    this.refreshPdfViewer();
  }

  constructor(private element: ElementRef) {
    // The workerSrc property should be specified.
    //PDFJS.workerSrc = '../../build/dist/build/pdf.worker.js';
    // Or
    PDFJS.disableWorker = true;
  }

  ngOnInit(): void {
    let container = this.element.nativeElement.querySelector('div');

    container.addEventListener('pagesinit', () => this.onPagesInit());
    container.addEventListener('scalechange', () => this.onScaleChange());

    this._pdfViewer = new PDFJS.PDFViewer({
      container: container
    });
  }

  private onPagesInit() {
    this.refreshPdfViewer();
  }

  private onScaleChange() {
    this.zoomChange.emit(this._pdfViewer.currentScale);
  }

  private loadDocument() {
    (<any>window).PDFJS.getDocument(this._src).then((pdf: any) => {
      this._pdfDocument = pdf;
      this._pdfViewer.setDocument(pdf);

      this.afterLoadComplete.emit(pdf);
    });
  }

  private refreshPdfViewer() {
    if (!this._pdfDocument) {
      return;
    }

    if (!this.isValidPageNumber(this._page)) {
      this._page = 1;
      this._pdfViewer.page = this._page;
    }

    this._pdfViewer.currentScaleValue = this._zoom;
  }

  private isValidPageNumber(page: number) {
    return this._pdfDocument.numPages >= page && page >= 1;
  }
}