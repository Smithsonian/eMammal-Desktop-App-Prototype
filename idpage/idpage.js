const electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./main');
const fuzzy = require('fuzzy');
const storage = require('electron-json-storage');
const upload = require('../lib/upload');

const THUMBNAIL_STYLE = 'height: 100px; margin-right: 5px';
const SPECIES_BUTTON_CLASSES =
  'species-button mdl-button mdl-js-button mdl-js-ripple-effect';

let seqScroll, imgScroll;  // Sequence image preview tile list (top of page)
let sequenceSession, currentSequence;  // List of sequences, the current sequence
let userId;  // Fake data currently, until login is wired up
let currentProject;
let currentSubproject;
let currentDeployment;
let nidCount, nidProgress;  // "nid" == Needs identifying bar, text
let idCount, idProgress;    // "id" == Identified bar, text
let currentSpeciesButtons;  // The list of species as buttons in the DOM
let searchField;
let uploadButton, uploadAllButton;
let currentImageViewer;  // The image viewer in use. See image_viewer.js
let viewport;  // The HTML element (a div) used by the image viewer.

$(document).ready(() => {
  document.getElementById('nid-progress')
      .addEventListener('mdl-componentupgraded', function() {
    nidProgress = this.MaterialProgress;
  });
  document.getElementById('id-progress')
      .addEventListener('mdl-componentupgraded', function() {
    idProgress = this.MaterialProgress;
  });

  seqScroll = $('#seq-scroll');
  imgScroll = $('#img-scroll');
  nidCount = $('#nid-count');
  idCount = $('#id-count');
  searchField = $('#species-search');
  uploadButton = $('#upload-btn');
  uploadAllButton = $('#upload-all-btn')
  viewport = $('#viewport');

  searchField.on('input', updateSearch);
  uploadButton.on('click', uploadSequence);
  uploadAllButton.on('click', uploadAllSequences);

  setupState();
});

function setupState() {
  // Get global state from the (node.js process) main module.
  var initialConfig = mainProcess.getIdConfig();

  currentProject = new Project(initialConfig.projectId);
  currentProjectId = initialConfig.projectId;
  currentSubprojectId = initialConfig.subprojectId;
  currentDeploymentId = initialConfig.deploymentId;
  userId = initialConfig.userId;
  populateSpeciesList();
  populateDropdowns();

  pickImages((sequences) => {
    sequenceSession = new SequenceSession(sequences, THUMBNAIL_STYLE);
    seqScroll.append(sequenceSession.getThumbnails());

    sequenceSession.setSequenceSelectedCallback(selectedSequence);

    updateProgress();
  });
}

/* TODO: deployment dropdown must mutate when subproject is changed, and subproject must mutate when project is changed */
function populateDropdowns() {
  storage.getMany(['metadata-projects', 'metadata-subprojects', 'metadata-deployments'], function(error, data) {
    if (error) throw error;
    const projects = data['metadata-projects'];
    const subprojects = data['metadata-subprojects'][currentProjectId];
    const deployments = data['metadata-deployments'][currentSubprojectId];

    for (var i = 0; i < projects.length; i++) {
      const project = projects[i];
      $('#project-selector').append($('<option>', {
        value: project.project_id,
        text: project.project_id.toString() + ' - '+ project.name
      }));
    }
    $('#project-selector').val(currentProjectId).change();

    for (var i = 0; i < subprojects.length; i++) {
      const subproject = subprojects[i];
      $('#subproject-selector').append($('<option>', {
        value: subproject.subproject_id,
        text: subproject.subproject_id.toString() + ' - '+ subproject.sub_project_name
      }));
    }
    $('#subproject-selector').val(currentSubprojectId).change();

    for (var i = 0; i < deployments.length; i++) {
      const deployment = deployments[i];
      $('#deployment-selector').append($('<option>', {
        value: deployment.deployment_id,
        text: deployment.deployment_id.toString() + ' - '+ deployment.title
      }));
    }
    $('#deployment-selector').val(currentDeploymentId).change();
  });
}

function pickImages(callback) {
  let imagesDir = mainProcess.selectDir();

  // From lib/images.js
  sequencesFromDir(imagesDir).then((sequences) => {
    callback(sequences);
  });
}

function updateProgress() {
  const ids = sequenceSession.getIdentifiedCount();
  const total = sequenceSession.getTotalCount();

  nidProgress.setProgress(((total - ids) / total) * 100);
  nidCount.text(total - ids);

  idProgress.setProgress((ids / total) * 100);
  idCount.text(ids);
}

function populateSpeciesList() {
  const buttonList = $('#button-list');
  buttonList.html('');

  // Fill out the species list to the right of the image viewer
  currentProject.loadPossibleClassifiers(classifiers => {
    currentSpeciesButtons = classifiers.map(classifier => {
      // Create the actual UI element to show on the page
      const button = document.createElement('button');
      button.className = SPECIES_BUTTON_CLASSES;
      button.innerText = classifier;
      button.addEventListener('click', () => onSpeciesSelect(classifier));

      return button;
    });

    buttonList.append(currentSpeciesButtons);
  });
}

function updateSearch() {
  const buttonList = $('#button-list');
  buttonList.html('');

  const options = { extract: el => el.innerText };
  const results =
      fuzzy.filter(searchField.val(), currentSpeciesButtons, options);

  buttonList.append(results.map(el => el.original));
}

function uploadSequence() {
  if (!currentSequence.hasBeenIdentified()) {
    return;
  }
  upload.packSequence(userId,
    currentProjectId,
    currentSubprojectId,
    currentDeploymentId,
    // TODO: Update this when an actual sequence index has been determined
    1,
    currentSequence.getImageSrcs(),
    currentSequence.getIdentifications());
}

function uploadAllSequences() {
  var sequences = sequenceSession.getIdentifiedSequences();
  // TODO: Link to upload page when it is built.
}

function selectedSequence(sequence) {
  if (currentImageViewer) {
    currentImageViewer.teardown();
  }

  currentImageViewer = new ImageViewer(
      sequence.getImageSrcs(),
      viewport,
      imgScroll,
      THUMBNAIL_STYLE);

  currentSequence = sequence;
}

function onSpeciesSelect(identification) {
  if (!currentSequence) {
    return;
  }

  currentSequence.addIdentification(identification);
  updateProgress();
}
