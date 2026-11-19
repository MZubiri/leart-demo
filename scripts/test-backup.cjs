const fs=require('fs'),cp=require('child_process'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const dir=fs.mkdtempSync('/tmp/leart-backup-'); const repo=process.cwd(); const projects=['leart_bak_'+process.pid,'leart_restore_'+process.pid];
const env={...process.env,COMPOSE_FILE:path.join(dir,'compose.yml'),MYSQL_PASSWORD:crypto.randomBytes(20).toString('hex'),MYSQL_ROOT_PASSWORD:crypto.randomBytes(20).toString('hex')};
fs.writeFileSync(env.COMPOSE_FILE,`services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: leart_db
      MYSQL_USER: leart
      MYSQL_PASSWORD: \${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}
    volumes: ["mysql_data:/var/lib/mysql"]
    healthcheck:
      test: ['CMD-SHELL', 'MYSQL_PWD=$MYSQL_PASSWORD mysql -h 127.0.0.1 -u leart -D leart_db -e "SELECT 1"']
      interval: 2s
      timeout: 3s
      retries: 60
  backend:
    image: nginx:alpine
    entrypoint: ["sleep", "infinity"]
    volumes: ["uploads_data:/app/wwwroot/uploads", "private_data:/app/storage"]
volumes:
  mysql_data:
  uploads_data:
  private_data:
`);
const run=(project,bin,args,extra={})=>cp.execFileSync(bin,args,{cwd:repo,env:{...env,COMPOSE_PROJECT_NAME:project},encoding:'utf8',...extra});
const compose=(project,...args)=>run(project,'docker',['compose',...args]);
try {
 const original=projects[0],restored=projects[1];
 compose(original,'up','-d','--wait','mysql','backend');
 compose(original,'exec','-T','mysql','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" mysql -u leart leart_db -e "CREATE TABLE BackupProbe (id INT PRIMARY KEY, value VARCHAR(50)); INSERT INTO BackupProbe VALUES (1,\'retained\');"');
 compose(original,'exec','-T','backend','sh','-c','mkdir -p /app/storage/orders /app/wwwroot/uploads/products; echo private-photo > /app/storage/orders/test.png; echo public-photo > /app/wwwroot/uploads/products/test.png');
 run(original,'bash',['scripts/backup.sh',path.join(dir,'copy')]);
 assert(compose(original,'ps','--status','running','-q','backend'));
 compose(original,'up','-d','--force-recreate','backend');
 assert.equal(compose(original,'exec','-T','backend','cat','/app/storage/orders/test.png').trim(),'private-photo');
 run(restored,'bash',['scripts/restore.sh',path.join(dir,'copy')]);
 const value=compose(restored,'exec','-T','mysql','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" mysql -u leart -N leart_db -e "SELECT value FROM BackupProbe WHERE id=1"');
 assert.equal(value.trim(),'retained');
 for(const [file,expected] of [['/app/storage/orders/test.png','private-photo'],['/app/wwwroot/uploads/products/test.png','public-photo']]) assert.equal(compose(restored,'run','--rm','-T','--no-deps','--entrypoint','cat','backend',file).trim(),expected);
 assert.throws(()=>run(restored,'bash',['scripts/restore.sh',path.join(dir,'copy')],{stdio:'pipe'}));
 console.log('Backup/restore: DB, public/private files, recreation, API resume and overwrite refusal passed.');
} finally {for(const project of projects)try{compose(project,'down','-v','--remove-orphans');}catch{} fs.rmSync(dir,{recursive:true,force:true});}
