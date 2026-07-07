const getPublicID = (filePath) => {
  const splittedPath = filePath.split("/");
  const lastSection = splittedPath[splittedPath.length - 1];
  const splittedSection = lastSection.split(".");

  return splittedSection[0];
};

export { getPublicID };
