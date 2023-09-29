exports = async function(changeEvent) {
  const { operationType } = changeEvent;

  if (operationType === 'insert') {
    await context.functions.execute("tg_posts_insert", changeEvent);
  } else if (operationType === 'update') {
      
    
  } else if (operationType === 'delete') {
    await context.functions.execute("tg_posts_delete", changeEvent);
  }
};
