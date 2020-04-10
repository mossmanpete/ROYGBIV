var TextureAtlasHandler = function(){
  this.currentTextureCount = 0;
}

TextureAtlasHandler.prototype.dispose = function(){
  if (this.atlas){
    this.atlas.destroy();
    this.atlas = 0;
  }
}

TextureAtlasHandler.prototype.compressTexture = function(base64Data, readyCallback, errorCallback, textureCount){
  var postRequest = new XMLHttpRequest();
  var data = JSON.stringify({image: base64Data});
  postRequest.open("POST", "/compressTextureAtlas", true);
  postRequest.setRequestHeader('Content-Type', 'application/json');
  postRequest.onreadystatechange = function(err){
    if (postRequest.readyState == 4 && postRequest.status == 200){
      var resp = JSON.parse(postRequest.responseText);
      if (resp.error){
        errorCallback();
      }else{
        textureAtlasHandler.atlas = new TexturePack(null, null, {isAtlas: true});
        textureAtlasHandler.atlas.loadTextures(false, function(){
          textureAtlasHandler.currentTextureCount = textureCount;
          readyCallback();
        });
      }
    }
  }
  postRequest.onerror = function(){
    errorCallback();
  }
  postRequest.send(data);
}

TextureAtlasHandler.prototype.onTexturePackChange = function(readyCallback, errorCallback, force){
  var refreshNeeded = false;
  var textureCount = 0;
  var texturesObj = new Object();
  for (var texturePackName in texturePacks){
    textureCount ++;
    texturesObj[texturePackName] = texturePacks[texturePackName].diffuseTexture;
  }
  if (force || this.currentTextureCount != textureCount){
    this.dispose();
    if (textureCount == 0){
      this.currentTextureCount = 0;
      readyCallback();
      return;
    }
    var textureMerger;
    try{
      textureMerger = new TextureMerger(texturesObj);
      this.textureMerger = textureMerger;
    }catch (err){
      console.error(err);
      errorCallback();
      return;
    }
    this.compressTexture(textureMerger.mergedTexture.image.toDataURL(), readyCallback, errorCallback, textureCount);
  }
}

TextureAtlasHandler.prototype.export = function(){
  var exportObject = new Object();
  if (this.atlas){
    exportObject.hasTextureAtlas = true;
    exportObject.ranges = this.textureMerger.ranges;
  }else{
    exportObject.hasTextureAtlas = false;
  }
  return exportObject;
}

TextureAtlasHandler.prototype.import = function(exportObject, readyCallback){
  if (isDeployment){
    this.textureMerger = new TextureMerger();
    this.textureMerger.ranges = JSON.parse(JSON.stringify(exportObject.ranges));
    textureAtlasHandler.atlas = new TexturePack(null, null, {isAtlas: true});
    textureAtlasHandler.atlas.loadTextures(false, function(){
      readyCallback();
    });
  }else{
    this.onTexturePackChange(readyCallback, readyCallback);
  }
}
