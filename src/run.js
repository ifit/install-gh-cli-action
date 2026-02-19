import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as path from 'path';

async function run() {
  try {
    let version = core.getInput('gh-cli-version');
    if (version) {
      await getGhCli(version);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getGhCli(version) {
  let toolPath = tc.find('gh-cli', version);

  if (!toolPath) {
    toolPath = await downloadGhCli(version);
  }

  toolPath = path.join(toolPath, 'bin');
  core.addPath(toolPath);
}

function getOperatingSystem() {
  const platform = process.platform;
  if (platform === 'darwin') {
    return 'macOS';
  }
  return platform;
}

async function downloadGhCli(version) {
  let architecture = 'amd64';
  if (process.arch == 'arm64') {
    architecture = 'arm64';
  }

  const operatingSystem = getOperatingSystem();
  const toolDirectoryName = `gh_${version}_${operatingSystem}_${architecture}`;
  const fileExtension = operatingSystem === 'macOS' ? 'zip' : 'tar.gz';
  const downloadUrl = `https://github.com/cli/cli/releases/download/v${version}/${toolDirectoryName}.${fileExtension}`;

  console.log(`downloading ${downloadUrl}`);
  try {
    const downloadPath = await tc.downloadTool(downloadUrl);
    let extractedPath;

    if (operatingSystem === 'macOS') {
      extractedPath = await tc.extractZip(downloadPath);
    } else {
      extractedPath = await tc.extractTar(downloadPath);
    }

    let toolRoot = path.join(extractedPath, toolDirectoryName);
    return await tc.cacheDir(toolRoot, 'gh-cli', version);
  } catch (err) {
    throw err;
  }
}
run();
