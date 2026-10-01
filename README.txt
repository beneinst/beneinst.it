Pulizia URL statici Beneinst (PowerShell 5.1 o successivo)

Copiàre questi file nella cartella radice del Git, accanto a sitemap.xml.

1. Dopo WebCopy e la correzione del dominio, generare sitemap.xml.
2. Eseguire Anteprima-pulizia-beneinst.bat e leggere i due rapporti.
3. Se le destinazioni sono corrette, eseguire Applica-pulizia-beneinst.bat.
4. Controllare i nuovi file, poi eseguire git status, commit e push.

Il primo script usa la tabella verificata di 42 vecchie pagine di autore.
Il secondo analizza i file index.php-N.html e usa l'ID articolo per trovare
una sola destinazione nella sitemap. I casi senza corrispondenza univoca
rimangono invariati e sono elencati nel rapporto.

I vecchi URL non vengono eliminati: diventano piccole pagine di rimando
con canonical verso il nuovo URL. GitHub Pages non offre da questi file
un reindirizzamento HTTP 301. I vecchi contenuti originali sono copiati
nella cartella beneinst-backup-url-YYYYMMDD-HHMMSS accanto alla radice Git,
così non viene inclusa accidentalmente in un commit.

Non eseguire la generazione sitemap dopo l'applicazione senza verificarne
il rapporto: i vecchi file rimangono sul disco e devono restare fuori dalla
sitemap principale. Se la sitemap li include, correggere il generatore.

Per passare un percorso diverso dalla cartella dello script:
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Reindirizza-pagine-autore.ps1 -Root "D:\Siti GitHub\beneinst.it"
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Analizza-e-reindirizza-index.ps1 -Root "D:\Siti GitHub\beneinst.it"

Per modificare i file aggiungere -Apply dopo il percorso.
