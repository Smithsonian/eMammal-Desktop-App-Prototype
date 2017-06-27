const SequenceState = {
  INCOMPLETE: 0,
  IN_PROGRESS: 1,
  FINISHED: 2,
};

const INDICATOR_CLASS = 'indicator';
const INCOMPLETE_CLASS = 'incomplete';
const IN_PROGRESS_CLASS = 'in-progress';
const FINISHED_CLASS = 'finished';

class Sequence {
  constructor(images) {
    this.images_ = images;
    this.state_ = SequenceState.INCOMPLETE;
    this.stateDiv_ = makeStateIndicator(this.state_);
    this.elem_ = null;

    this.imageElems_ = null;

    // To be filled in by user
    this.identifications_ = [];
  }

  getThumbnail(style) {
    if (this.elem_) {
      return this.elem_;
    }

    const img = document.createElement('img');
    img.src = this.images_[0];
    img.style = style;

    const div = document.createElement('div');
    div.appendChild(img);
    div.appendChild(this.stateDiv_);
    div.style = 'display: inline-block; position: relative;';

    this.elem_ = div;

    return this.elem_;
  }

  getImageArray(style) {
    if (this.imageElems_) {
      return this.imageElems_;
    }

    const arr = this.images_.map(src => {
      const img = document.createElement('img');
      img.src = src;
      img.style = style;

      return img;
    });

    this.imageElems_ = arr;
    return this.imageElems_;
  }

  getImageSrcs() {
    return this.images_;
  }

  updateState() {
    // TODO: Check if we are incomplete or not.
    this.state_ = SequenceState.INCOMPLETE;
    this.updateStateDiv_();
  }

  select() {
    this.state_ = SequenceState.IN_PROGRESS;
    this.updateStateDiv_();
  }

  updateStateDiv_() {
    if (this.elem_) {
      this.elem_.removeChild(this.stateDiv_);
      this.stateDiv_ = makeStateIndicator(this.state_);
      this.elem_.appendChild(this.stateDiv_);
    }
  }

  addIdentification(id) {
    this.identifications_.push(id);
  }

  getIdentifications() {
    return this.identifications_;
  }

  hasBeenIdentified() {
    return !!this.identifications_.length;
  }
}

function makeStateIndicator(state) {
  const div = document.createElement('div');
  div.className = INDICATOR_CLASS + ' ';

  switch(state) {
    case SequenceState.INCOMPLETE:
      div.className += INCOMPLETE_CLASS;
      div.innerText = '!';
      break;
    case SequenceState.IN_PROGRESS:
      div.className += IN_PROGRESS_CLASS;
      break;
    case SequenceState.FINISHED:
      div.className += FINISHED_CLASS;
      break;
  }

  return div;
}

