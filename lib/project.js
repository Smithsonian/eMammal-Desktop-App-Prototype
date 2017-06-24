class Project {
  constructor(id) {
    this.id_ = id;
    this.classifiers_ = [];
  }

  loadPossibleClassifiers(callback) {
    // TODO: Populate the list of classifiers using a Drupal call.
    this.classifiers_ =
        ['Deer', 'Human', 'Squirrel', 'Michigan Dog Man', 'Other'];

    callback(this.classifiers_);
  }

  getClassifiers() {
    return this.classifiers_;
  }
}
