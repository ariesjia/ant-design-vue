import reduce from 'lodash/reduce';

function loopFiles(item, callback) {
  const dirReader = item.createReader();
  let fileList = [];

  function sequence() {
    dirReader.readEntries(entries => {
      const entryList = Array.prototype.slice.apply(entries);
      fileList = fileList.concat(entryList);

      // Check if all the file has been viewed
      const isFinished = !entryList.length;

      if (isFinished) {
        callback(fileList);
      } else {
        sequence();
      }
    });
  }

  sequence();
}

const traverseFileTree = (files, callback, isAccepted) => {
  const fileGroups = [[], []];
  const _traverseFileTree = (item, path) => new Promise((resolve) => {
    path = path || '';
    if (item.isFile) {
      item.file(file => {
        const accepted = isAccepted(file);
        if (accepted) {
          callback([file]);
        } else {
          fileGroups[1].push(file);
        }
        resolve(fileGroups);
      });
    } else if (item.isDirectory) {
      loopFiles(item, entries => {
        Promise.all(
          entries.map(entryItem => _traverseFileTree(entryItem, `${path}${item.name}/`))
        ).then((s) => {
          resolve(fileGroups);
        });
      });
    }
  });

  return reduce(files, (prev, file) => {
    return prev.then(() => {
      return _traverseFileTree(file.webkitGetAsEntry());
    });
  }, Promise.resolve());
};
export default traverseFileTree;
