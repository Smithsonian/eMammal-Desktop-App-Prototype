class ImageViewer {
  constructor(srcs, viewport, scroll, thumbnailStyle) {
    this.srcs_ = srcs;
    this.viewport_ = viewport;
    this.scroll_ = scroll;

    this.scrollDivs_ = this.srcs_.map(src => {
      const img = document.createElement('img');
      img.src = src;
      img.style = thumbnailStyle;

      const div = document.createElement('div');
      div.appendChild(img);
      div.style = 'display: inline-block; position: relative';

      return div;
    });

    this.selectedDiv_ = document.createElement('div');
    this.selectedDiv_.className = INDICATOR_CLASS + ' ' + IN_PROGRESS_CLASS;

    this.scrollDivs_.forEach((div, i) => {
      div.addEventListener('click', e => {
        this.selectImage_(i);
      });
    });

    scroll.append(this.scrollDivs_);

    this.selectImage_(0);
  }

  selectImage_(index) {
    this.selectedDiv_.remove();

    this.scrollDivs_[index].appendChild(this.selectedDiv_);

    // Viewport is a jquery element, not a raw DOM element
    this.viewport_.attr('src', this.srcs_[index]);
  }

  teardown() {
    this.scroll_.html('');
    this.viewport_.removeAttr('src');
  }
}
