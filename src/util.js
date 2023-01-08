
import fs from 'fs';
import path from 'path';

const findFileInDir = (dir, filename) => {
    let filepath = null;
    const files = fs.readdirSync(dir);
    for(let index = 0; index < files.length; index++) {
        if(files[index].startsWith(filename)) {
            filepath = path.join(dir, files[index]);
            break;
        }
    }
    return filepath;
}

const findAndDeleteFileInDir = (dir, filename) => {
    const filepath = findFileInDir(dir, filename);
    if(filepath) {
        filepath = path.join(image_path, files[index]);
        try {
            fs.unlinkSync(filepath);
        } catch (err) {
            console.error('Failed to delete file');
            console.error(err);
        }
    }
}

export default { findFileInDir, findAndDeleteFileInDir };