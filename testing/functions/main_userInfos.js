exports = async function(changeEvent) {
  const { operationType } = changeEvent;

  if (operationType === 'insert') {
    
  } else if (operationType === 'update') {
      await context.functions.execute("tg_userInfos_update", changeEvent);
    
  } else if (operationType === 'delete') {

  }
};
