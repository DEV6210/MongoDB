exports = async function(changeEvent) {
  const { operationType } = changeEvent;

  if (operationType === 'insert') {
    
  } else if (operationType === 'update') {
      await context.functions.execute("tg_postReactions_update", changeEvent);
    
  } else if (operationType === 'delete') {
    await context.functions.execute("tg_posts_delete", changeEvent);
    
  }
};
