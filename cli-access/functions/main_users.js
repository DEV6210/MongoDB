exports = async function(changeEvent) {
  const { operationType } = changeEvent;

  if (operationType === 'insert') {
    await context.functions.execute("tg_users_insert", changeEvent);
  } else if (operationType === 'update') {
      
    
  } else if (operationType === 'delete') {
    // await context.functions.execute("users_delete", changeEvent);
  }
};
