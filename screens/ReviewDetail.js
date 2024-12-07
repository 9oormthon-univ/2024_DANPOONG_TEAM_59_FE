import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

const ReviewDetail = () => {
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="chevron-left" size={24} color="#000" />
                        <Text style={styles.headerText}>받은 후기</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContainer}>
                    <ScrollView style={styles.content}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.mainTitle}>김토끼님에 보낸</Text>
                            <Text style={styles.mainTitle}>따뜻한 후기가 도착했어요.</Text>
                        </View>

                        <Text style={styles.subTitle}>
                            김토끼님과 11월 4일 돌봄어쨌고{'\n'}
                            저써고 왔료했어요.
                        </Text>

                        <View style={styles.reviewCard}>
                            <View style={styles.profileContainer}>
                                <Image
                                    source={require('../assets/logo.png')}
                                    style={styles.profileImage}
                                />
                                <View style={styles.profileInfo}>
                                    <Text style={styles.name}>김토끼님</Text>
                                    <Text style={styles.date}>2024.11.04  02:10</Text>
                                </View>
                            </View>

                            <View style={styles.statusContainer}>
                                <View style={styles.statusRow}>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>구인중</Text>
                                    </View>
                                    <Text style={styles.contentText}>도와주세요!!</Text>
                                </View>
                            </View>

                            <View style={styles.infoContainer}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>돌봄 날짜</Text>
                                    <Text style={styles.infoContent}>
                                        2024.11.01, 2024.11.02, 2024.11.03,{'\n'}
                                        2024.11.04
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>돌봄 시간</Text>
                                    <Text style={styles.infoContent}>
                                        01시 41분 - 05시 41분
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.reviewContent}>
                                아이가 심리 치료를 받는다고 하면 이상하게 생각하는 사람들이 여전히 많다. 그런데 아이가 심리치료를 받을 때 부모의 역할도 심리 치료사의 역할 만큼이나 매우 중요하다.
                            </Text>
                        </View>
                    </ScrollView>

                    <View style={styles.bottomButtonContainer}>
                        <TouchableOpacity style={styles.viewMyReviewButton}>
                            <Text style={styles.buttonText}>내가 보낸 후기 보기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingBottom: 80,
    },
    titleContainer: {
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 34,
    },
    subTitle: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 24,
        lineHeight: 20,
    },
    reviewCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
        color: '#666666',
    },
    statusContainer: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    tagText: {
        fontSize: 13,
        color: '#666666',
    },
    contentText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    infoContainer: {
        marginBottom: 16,
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    infoLabel: {
        fontSize: 13,
        color: '#666666',
    },
    infoContent: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    reviewContent: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    viewMyReviewButton: {
        backgroundColor: '#FFEDAE',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
});

export default ReviewDetail;