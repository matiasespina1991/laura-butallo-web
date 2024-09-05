#!/bin/bash

# Antes de usar, dar permisos de ejecución: chmod +x concatenate_files.sh    

# Nombres de los archivos del proyecto Next.js
files=(
    "src/app/page.tsx"
    "src/app/layout.tsx"
    "src/app/view/[id]/page.tsx"
    "src/app/globals.css"
    "src/app/page.module.css"
    "package.json"
)

# Archivo de salida
output_file="_combined.txt"

# Limpiar el archivo de salida si ya existe
> $output_file

# Concatenar los archivos
for file in "${files[@]}"
do
    cat "$file" >> $output_file
    echo "" >> $output_file # Agregar una línea en blanco entre archivos
done

echo "Files concatenated into $output_file"

# Agregar la estructura de directorios al archivo combinado
echo -e "\nDirectory structure (3 levels, excluding node_modules and .next):" >> $output_file
tree -L 3 --prune -I 'node_modules|.next' >> $output_file

echo "Directory structure added to $output_file"
