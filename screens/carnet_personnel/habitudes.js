import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, FlatList, ScrollView, TouchableOpacity, Modal, Button, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { globalStyles } from '../../styles/global';
import { MaterialIcons } from '@expo/vector-icons';
import Card from '../../Shared/card';
import { Formik } from 'formik';
import * as yup from 'yup';
import DatePicker from 'react-native-datepicker';
import { AsyncStorage } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as firebase from 'firebase';
import "firebase/firestore";
import {decode, encode} from 'base-64'
if (!global.btoa) { global.btoa = encode }
if (!global.atob) { global.atob = decode }

export default function Habitudes({navigation, route}){

    var db = firebase.firestore();

    const [modalOpen, setModalOpen] = useState(false);
    const [habitudes, setHabitudes] = useState([]);

    const [text, setText] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            _retrieveData();
        }, [])
    );
    useEffect(() => {
        _storeData();
    }, [habitudes,route]);

    const _storeData = async () => {
        try {
            await AsyncStorage.setItem(
              'habitudes',
              JSON.stringify(habitudes)
            );
            console.log(habitudes);
          } catch (error) {
            console.log('missed')
          }
      };

    const _retrieveData = async () => {
        try {
            const value = await AsyncStorage.getItem('habitudes');
            if (value !== null) {
                console.log('returned');
                setHabitudes(JSON.parse(value));
            }
        } catch (error) {
            console.log('no value');
        }
    };

    const addHabitudes = (habitudes) => {
        habitudes.key = Math.random().toString();
        habitudes.userKey = global.userKey;
        setHabitudes((currenthabitudes) => {
            return [habitudes, ...currenthabitudes];
        });
        try {
            db.collection('habitudes').doc(habitudes.key).set({
                key: habitudes.key,
                userKey: habitudes.userKey,
                nomHb: habitudes.nomHb,
                datedebut: habitudes.datedebut,
                datefin: habitudes.datefin
            });   
        } catch (error) {
            console.log('firebase error');
        }
        setModalOpen(false);
    }

    const supprimerAlert = (key) => {
        Alert.alert('supprimer','êtes-vous sûr de vouloir supprimer ce contenu?',[
            {text: 'No', onPress: () => console.log('No')},
            {text: 'Oui', onPress: () => (supprimer(key))}
        ]);
    }

    const supprimer = (key) => {
        console.log(key);
        setHabitudes((prev) => {
            return prev.filter(am => am.key != key)
        })
        db.collection('habitudes').doc(key).delete();
    }

    const habitudeSchema = yup.object({
        nomHb: yup.string().required().min(2).max(60),
        datedebut: yup.string().required(),
        datefin: yup.string().required(),
    })

        return(
            <View style={ globalStyles.container }>
                <Modal visible={modalOpen} animationType='slide'>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalContainer}>
                            <MaterialIcons name='close' size={24} style={{ ...styles.modalToggle, ...styles.modalClose}}  onPress={() =>setModalOpen(false) }/>
                                <View style={globalStyles.container}>
                                    <ScrollView>
                                    <Formik
                                    initialValues={{ nomHb:'', datedebut:'', datefin:'' }}
                                    validationSchema={habitudeSchema}
                                    onSubmit={(values,actions) => {
                                        actions.resetForm();
                                        addHabitudes(values);
                                    }}
                                    >
                                        {(props) => (
                                            <View>
                                                <TextInput
                                                    style={globalStyles.input}
                                                    placeholder='habitude'
                                                    onChangeText={props.handleChange('nomHb')}
                                                    value={props.values.nomHb}
                                                    onBlur={props.handleBlur('nomHb')}
                                                />
                                                <Text style={globalStyles.errorText}>{ props.touched.nomHb && props.errors.nomHb }</Text>

                                                <DatePicker
                                                    style={{width: 200, marginBottom: 20}}
                                                    mode="date"
                                                    placeholder="select date debut"
                                                    format="YYYY-MM-DD"
                                                    
                                                    confirmBtnText="Confirm"
                                                    cancelBtnText="Cancel"
                                                    customStyles={{
                                                    dateIcon: {
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 4,
                                                        marginLeft: 0
                                                    },
                                                    dateInput: {
                                                        marginLeft: 36
                                                    }
                                                    // ... You can check the source to find the other keys.
                                                    }}
                                                    onDateChange={props.handleChange('datedebut')}
                                                />
                                                <Text style={globalStyles.errorText}>{ props.touched.datedebut && props.errors.datedebut }</Text>

                                                <DatePicker
                                                    style={{width: 200, marginBottom: 20}}
                                                    mode="date"
                                                    placeholder="select date fin"
                                                    format="YYYY-MM-DD"
                                                    confirmBtnText="Confirm"
                                                    cancelBtnText="Cancel"
                                                    customStyles={{
                                                    dateIcon: {
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 4,
                                                        marginLeft: 0
                                                    },
                                                    dateInput: {
                                                        marginLeft: 36
                                                    }
                                                    // ... You can check the source to find the other keys.
                                                    }}
                                                    onDateChange={props.handleChange('datefin')}
                                                />
                                                <Text style={globalStyles.errorText}>{ props.touched.datefin && props.errors.datefin }</Text>
                                                
                                                <Button title='submit' color='maroon' onPress={props.handleSubmit} />
                                            </View>
                                        )}
                                    </Formik>
                                    </ScrollView>
                                </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <MaterialIcons name='add' size={24} style={styles.modalToggle}  onPress={() =>setModalOpen(true) }/>

                <TextInput style={styles.searchInput} placeholder='Search' onChangeText={ (text) => setText(text)} />

                <FlatList
                data={habitudes}
                renderItem={({ item }) => {
                    if(item.userKey == global.userKey)
                    if(item.nomHb.startsWith(text))
                    return(
                    <View>
                        <MaterialIcons name='close' size={15} onPress={() => supprimerAlert(item.key)}/>
                        <TouchableOpacity onPress={() => navigation.navigate('HabitudesDetails', item) }>
                            <Card>
                                <Text style={globalStyles.titleText}>{item.nomHb}</Text>
                            </Card>
                        </TouchableOpacity>
                    </View>
                )}}
                />
            </View>
        )
}

const styles = StyleSheet.create ({
    modalContainer:{
        flex: 1,
    },
    modalToggle:{
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f2f2f3',
        padding: 10,
        borderRadius: 10,
        alignSelf: 'center',
    },
    modalClose: {
        marginBottom: 0,
        marginTop: 20,
    },
    searchInput:{
        padding: 10,
        borderColor: '#CCC',
        borderWidth: 1,
        backgroundColor: '#fff',
    },
});