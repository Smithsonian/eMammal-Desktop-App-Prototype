const electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./main');
const dialogPolyfill = require('dialog-polyfill');
const drupal = require('../lib/drupal');

let currentProjects, currentSubprojects, currentDeployments;

$(document).ready(() => {
  document.getElementById('login').onclick = () => {
    // add login logic, then get project info
    drupal.getActiveProjects('foo')
        .then(function(projects) {
          for (var i = 0; i < projects.length; i++) {
            var project = projects[i];
            $('#project-selector').append($('<option>', {
              value: project.project_id,
              text: getProjectLabel(project)
            }));
          }
          $('#project-select-div').addClass('is-dirty');
          return projects;
        })
        .then(function(projects) {
          currentProjects = projects;
          drupal.snapshotMetadata(projects);
          return getSubprojects(projects[0].project_id);
        })
        .then((subprojects) => {
          $('#subproject-select-div').addClass('is-dirty');
          return getDeployments(subprojects[0].subproject_id);
        })
        .then((deployments) => {
          $('#deployment-select-div').addClass('is-dirty');
        });
  };

  $('#project-selector').change(function() {
    const projectId = $('#project-selector option:selected').val();
    getSubprojects(projectId);
  });

  $('#subproject-selector').change(function() {
    const subprojectId = $('#subproject-selector option:selected').val();
    getDeployments(subprojectId);
  });

  const loadPhotosDialog = document.getElementById('load-photos-dialog');
  if (!loadPhotosDialog.showModal) {
    dialogPolyfill.registerDialog(loadPhotosDialog);
  }
  const deploymentInfoDialog =
      document.getElementById('deployment-info-dialog');
  if (!deploymentInfoDialog.showModal) {
    dialogPolyfill.registerDialog(deploymentInfoDialog);
  }

  document.getElementById('load-new-photos-btn').onclick = () => {
    loadPhotosDialog.showModal();
  };
  loadPhotosDialog.querySelector('#load-photos-dialog-close').onclick = () => {
    loadPhotosDialog.close();
  };
  loadPhotosDialog.querySelector('#load-photos-submit-btn').onclick = () => {
    setUpDeploymentInfoDialog();
    deploymentInfoDialog.showModal();
    loadPhotosDialog.close();
  };
  deploymentInfoDialog.querySelector('#deployment-info-dialog-close').onclick =
      () => {
        deploymentInfoDialog.close();
      };
  deploymentInfoDialog.querySelector('#deployment-info-submit-btn').onclick =
      () => {
        const deploymentInfo = {
          cameralatitude: $('#camera-latitude-input').val(),
          cameralongitude: $('#camera-longitude-input').val(),
          cameraId: $('#camera-id-input').val(),
          detectionDistance: $('#detection-distance-input').val(),
          cameraOperational: $('#camera-operational-input:checked').val(),
          comments: $('#comments').val(),
        };
        mainProcess.setIdConfig(
            '101', $('#project-selector option:selected').val(),
            $('#subproject-selector option:selected').val(),
            $('#deployment-selector option:selected').val(), deploymentInfo);
        console.log(remote.getGlobal('metadata'));
        window.location.href = '../idpage/idpage.html';
      };
});

function getProjectLabel(project) {
  return `${project.project_id.toString()} - ${project.name}`;
};

function getSubprojectLabel(subproject) {
  return `${subproject.subproject_id.toString()} - ${
                                                     subproject.sub_project_name
                                                   }`;
};

function getDeploymentLabel(deployment) {
  return `${deployment.deployment_id.toString()} - ${deployment.title}`;
};

function getCurrentSubproject() {
  const subprojectId = $('#subproject-selector option:selected').val();
  return currentSubprojects.find(
      (subproject) => subproject.subproject_id == subprojectId);
};

function getCurrentDeployment() {
  const deploymentId = $('#deployment-selector option:selected').val();
  return currentDeployments.find(
      (deployment) => deployment.deployment_id == deploymentId);
};

function getSubprojects(projectId) {
  return drupal.getSubprojects(projectId).then(function(subprojects) {
    $('#subproject-selector').find('option').remove().end();
    for (var i = 0; i < subprojects.length; i++) {
      var subproject = subprojects[i];
      $('#subproject-selector').append($('<option>', {
        value: subproject.subproject_id,
        text: getSubprojectLabel(subproject),
      }));
    }
    currentSubprojects = subprojects;
    return subprojects;
  });
};

function getDeployments(subprojectId) {
  return drupal.getDeployments(subprojectId).then(function(deployments) {
    $('#deployment-selector').find('option').remove().end();
    for (var i = 0; i < deployments.length; i++) {
      var deployment = deployments[i];
      $('#deployment-selector').append($('<option>', {
        value: deployment.deployment_id,
        text: getDeploymentLabel(deployment),
      }));
    }
    currentDeployments = deployments;
    return deployments;
  });
};

function setUpDeploymentInfoDialog() {
  const currentDeployment = getCurrentDeployment();
  $('#deployment-info-subproject')
      .text(getSubprojectLabel(getCurrentSubproject()));
  $('#deployment-info-deployment').text(getDeploymentLabel(currentDeployment));
  // TODO add in error checking, error messaging
  console.log(currentDeployment);
  const minLat = currentDeployment.project_minLat;
  const maxLat = currentDeployment.project_maxLat;
  const minLong = currentDeployment.project_minLong;
  const maxLong = currentDeployment.project_maxLong;
  $('#camera-latitude-input').attr({
    'min': currentDeployment.project_minLat,
    'max': currentDeployment.project_maxLat,
  });
};
