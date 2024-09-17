/* 

  if(req.file){
    req.body[req.file.fieldname] = `images/${req.file.filename}`;
  } 
  // ---------------------------------

      if (req.files instanceof Array && req.files.length) {
    const obj: Record<string, any[]> = {};
    req.files.forEach(file => {
      if (!obj[file.fieldname]?.length) {
        obj[file.fieldname] = [];
      }

      if (file.fieldname === 'images') {
        obj[file.fieldname].push({
          mimetype: file.mimetype,
          server_url: `images/${file.filename}`,
        });
      } else if (file.mimetype.includes('pdf')) {
        obj[file.fieldname].push({
          mimetype: file.mimetype,
          server_url: `pdfs/${file.filename}`,
        });
      } else if (file.mimetype.includes('audio')) {
        obj[file.fieldname].push({
          mimetype: file.mimetype,
          server_url: `audios/${file.filename}`,
        });
      } else if (file.mimetype.includes('video')) {
        obj[file.fieldname].push({
          mimetype: file.mimetype,
          server_url: `videos/${file.filename}`,
        });
      } else if (file.mimetype.includes('application')) {
        obj[file.fieldname].push({
          mimetype: file.mimetype,
          server_url: `docs/${file.filename}`,
        });
      } else {
        obj[file.fieldname].push({
          mimetype: file.mimetype,
          server_url: `others/${file.filename}`,
        });
      }
    });

    // shop.images = images;
    // shop.documents = documents;

    Object.entries(obj).forEach(([key,value])=>{
      //@ts-ignore
      shop[key] = value;
    })

  }
  
  
  */

// dynamically add fieldname to add value

/* 
  
    Object.entries(req.files as Record<string, any>).forEach(
    ([key, _value]: [string, any[]]) => {
      if (key && _value instanceof Array) {
        const shopKey = key as keyof Partial<IShop>; // Cast key to keyof IShop
        //@ts-ignore
        shop[shopKey] = _value?.map(file =>
          file.mimetype.includes('pdf')
            ? {
                mimetype: file.mimetype,
                server_url: `pdfs/${file.filename}`,
              }
            : file.mimetype.includes('image')
              ? {
                  mimetype: file.mimetype,
                  server_url: `images/${file.filename}`,
                }
              : file.mimetype.includes('audio')
                ? {
                    mimetype: file.mimetype,
                    server_url: `audios/${file.filename}`,
                  }
                : file.mimetype.includes('video')
                  ? {
                      mimetype: file.mimetype,
                      server_url: `videos/${file.filename}`,
                    }
                  : file.mimetype.includes('application')
                    ? {
                        mimetype: file.mimetype,
                        server_url: `docs/${file.filename}`,
                      }
                    : {
                        mimetype: file.mimetype,
                        server_url: `others/${file.filename}`,
                      },
        );
      }
    },
  );
  
  */
