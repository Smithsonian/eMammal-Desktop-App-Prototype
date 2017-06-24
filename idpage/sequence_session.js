class SequenceSession {
  /**
   * @param {!string[][]} sequences A list of sequences (image files)
   * @param {string} thumbnailStyle
   */
  constructor(sequences, thumbnailStyle) {
    this.sequences_ = sequences.map(s => new Sequence(s));
    this.thumbnailStyle_ = thumbnailStyle;
    this.sequenceSelectedCallback_ = null;

    this.sequences_.forEach(sequence => {
      const elem = sequence.getThumbnail(thumbnailStyle);
      elem.addEventListener('click', e => {
        this.selectSequence_(sequence);
      });
    });
  }

  getThumbnails() {
    return this.sequences_.map(s => s.getThumbnail(this.thumbnailStyle_));
  }

  getIdentifiedCount() {
    //return this.sequences_.reduce((total, s) => {
    //  return total + (s.hasBeenIdentified() ? 1 : 0);
    //}, 0);
    return this.getIdentifiedSequences().length;
  }

  getSequences() {
    return this.sequences_;
  }

  getIdentifiedSequences() {
    return this.sequences_.filter(function(s) {return s.hasBeenIdentified()});
  }

  getTotalCount() {
    return this.sequences_.length;
  }

  setSequenceSelectedCallback(callback) {
    this.sequenceSelectedCallback_ = callback;
  }

  selectSequence_(sequence) {
    sequence.select();

    this.sequences_.forEach(other => {
      if (sequence != other)
      other.updateState();
    });

    if (this.sequenceSelectedCallback_) {
      this.sequenceSelectedCallback_(sequence);
    }
  }
}

