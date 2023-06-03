import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert} from 'react-native';
import { Camera, requestCameraPermissionsAsync } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const [folderPath, setFolderPath] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const directory = await getPhotoDirectory();
      setFolderPath(directory);
    })();
  }, []);


  const takePicture = async () => {
    if (camera) {
      if (await requestCameraPermissionsAsync()) {
        const photoData = await camera.takePictureAsync();
        const photoUri = await savePhoto(photoData.uri);
        setPhoto(photoUri);
        setShowPhoto(true);
        console.log(photoUri);

      } else { }
    }
  };

  const savePhoto = async (photoUri) => {
    const { year, month, day } = getDateInfo();

    const directory = `${FileSystem.documentDirectory}${year}`;
    const subDirectory = `${directory}/${month}`;
    const subSubDirectory = `${subDirectory}/${day}`;

    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.makeDirectoryAsync(subDirectory, { intermediates: true });
    await FileSystem.makeDirectoryAsync(subSubDirectory, { intermediates: true });

    const folderInfo = await FileSystem.getInfoAsync(directory);
        if (!folderInfo.exists) {
          await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }

        const fileName = photoUri.split('/').pop();
        const newLocation = `${subSubDirectory}/${fileName}`;
        await FileSystem.moveAsync({ from: photoUri, to: newLocation });

        await MediaLibrary.saveToLibraryAsync(newLocation);

    return newLocation;
  };

  const getDateInfo = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    return { year, month, day };
  };

  const closePhoto = () => {
    setShowPhoto(false);
    setPhoto(null);
  };

  const showFolderPath = () => {
    if (folderPath) {
      Alert.alert('Carpeta de fotos', folderPath);
    }
  };

  const getPhotoDirectory = async () => {
    const { year, month, day } = getDateInfo();

    const directory = `${FileSystem.documentDirectory}${year}`;
    const subDirectory = `${directory}/${month}`;
    const subSubDirectory = `${subDirectory}/${day}`;

    return subSubDirectory;
  };

  if (hasPermission === null) {
    return <View />;
  } else if (hasPermission === false) {
    return <Text>No se ha otorgado permiso para usar la cámara</Text>;
  }

  return (
    <View style={styles.container}>
      {showPhoto ? (
        <View style={styles.photoContainer}>
          {photo && <Image style={styles.photo} source={{ uri: photo }} />}
          <TouchableOpacity style={styles.closeButton} onPress={closePhoto}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Camera style={styles.camera} ref={(ref) => setCamera(ref)}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Tomar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.folderButton} onPress={showFolderPath}>
            <Text style={styles.folderButtonText}>Mostrar Ruta</Text>
          </TouchableOpacity>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  button: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'blue',
    borderRadius: 20,
    padding: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
  },
  folderButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'blue',
    borderRadius: 20,
    padding: 10,
  },
  folderButtonText: {
    color: 'white',
    fontSize: 16,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'blue',
    borderRadius: 20,
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});